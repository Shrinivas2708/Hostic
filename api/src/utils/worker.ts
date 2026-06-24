import fs from "fs";
import path from "path";
import { Builds, BuildStatus } from "../model/Builds.model";
import { Deployments } from "../model/Deployments.model";
import { BuildJob } from "./buildQueue";
import { makeBuildLogger } from "./logger";
import { detectArtifactPath } from "./detectArtifactPath";
import { getWorkDir } from "./getWorkDir";
import { runStreamingDocker } from "./runStreaming";
import { dockerCmd } from "./dockercmd";
import { publishStatus, redisReady } from "./pub";
import uploadDirectoryToR2 from "./upload";
import { flushBuildLogs } from "./persistBuildLogs";
import { safeRemoveDir } from "./dockerFs";
import {
  buildInstallCommand,
  ensureNpmCacheDir,
  ensureNodeModulesDir,
  getNpmCacheContainerPath,
  getNodeModulesContainerPath,
  restoreDepsCache,
  saveDepsCache,
} from "./depsCache";
import type { DockerVolume } from "./dockercmd";
import {
  copyRepoToWorkDir,
  getDeploymentCacheDir,
  getLockfileInfo,
  normalizeBuildDir,
  resolveProjectRoot,
  syncCachedRepo,
} from "./deploymentCache";

export async function processJob(job: BuildJob) {
  const {
    buildId,
    deploymentId,
    repo_url,
    slug,
    project_type,
    installCommands,
    buildCommands,
    buildDir: jobBuildDir,
  } = job;

  const branch = job.branch || "main";
  const logger = makeBuildLogger(buildId);
  const startedAt = new Date();
  let workDir = "";
  const cacheDir = getDeploymentCacheDir(deploymentId);

  try {
    await redisReady;
    await publishStatus(buildId, BuildStatus.Building);

    logger.log("Starting build");
    logger.log(`Repository: ${repo_url}`);
    logger.log(`Branch: ${branch} · Framework: ${project_type}`);
    logger.log(`Build directory: ${normalizeBuildDir(jobBuildDir)}`);

    const build = await Builds.findOneAndUpdate(
      { build_name: buildId },
      { status: BuildStatus.Building, startedAt },
      { new: true }
    );
    if (!build) throw new Error(`Build with build_name ${buildId} not found`);

    workDir = await getWorkDir(buildId);

    const repoDir = await syncCachedRepo(cacheDir, repo_url, branch, logger);
    await copyRepoToWorkDir(repoDir, workDir, logger);

    const projectRoot = resolveProjectRoot(workDir, jobBuildDir, logger);
    const projectRootRel =
      path.relative(workDir, projectRoot).replace(/\\/g, "/") || ".";

    const lockfileInfo = getLockfileInfo(projectRoot);
    let depsRestore = { preferOffline: false, skipInstall: false };
    const extraVolumes: DockerVolume[] = [];

    if (lockfileInfo) {
      const npmCacheHostPath = await ensureNpmCacheDir(deploymentId);
      const nodeModulesHostPath = await ensureNodeModulesDir(deploymentId);

      extraVolumes.push(
        { host: npmCacheHostPath, container: getNpmCacheContainerPath() },
        { host: nodeModulesHostPath, container: getNodeModulesContainerPath() }
      );

      depsRestore = await restoreDepsCache(
        deploymentId,
        slug,
        lockfileInfo,
        projectRootRel,
        logger
      );

      if (!depsRestore.preferOffline && !depsRestore.skipInstall) {
        logger.log("No warm dependency cache — cold install");
      }
    }

    const installCmd = buildInstallCommand(
      installCommands ?? "npm install",
      depsRestore.preferOffline
    );
    const buildCmd = `
echo "[BUILD] Starting build process..." && \
${buildCommands}
`.trim();
    const combinedCmd = depsRestore.skipInstall
      ? buildCmd
      : `${installCmd} && ${buildCmd}`;

    if (depsRestore.skipInstall) {
      logger.log("Running build (install skipped)...");
    } else {
      logger.log(
        depsRestore.preferOffline
          ? "Installing dependencies (warm npm cache)..."
          : "Installing dependencies..."
      );
      logger.log("Running build...");
    }

    await runStreamingDocker(
      dockerCmd(
        projectRoot,
        combinedCmd,
        `build-${buildId}`,
        extraVolumes.length ? extraVolumes : undefined
      ),
      logger
    );

    if (lockfileInfo) {
      try {
        await saveDepsCache(
          deploymentId,
          slug,
          lockfileInfo,
          projectRootRel,
          logger
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.log(
          `Could not save npm cache (${msg}) — future builds may be slower`
        );
      }
    }

    const artifactPath = detectArtifactPath(projectRoot, project_type, logger);
    if (!artifactPath) {
      logger.error("Build output folder not found");
      throw new Error("build output folder not found");
    }

    const r2KeyPrefix = `__output/${slug}/${buildId}/`;
    logger.log(`Uploading artifacts to storage...`);
    await uploadDirectoryToR2(
      artifactPath,
      r2KeyPrefix,
      process.env.R2_BUCKET!,
      logger
    );
    logger.success("Artifacts uploaded");

    const finishedAt = new Date();
    await Builds.findOneAndUpdate(
      { build_name: buildId },
      {
        status: BuildStatus.Success,
        finishedAt,
        duration: finishedAt.getTime() - startedAt.getTime(),
        artifact_path: r2KeyPrefix,
      },
      { new: true }
    );

    await Deployments.findByIdAndUpdate(deploymentId, {
      current_build_id: build._id,
    });
    await publishStatus(buildId, BuildStatus.Success);

    logger.success("Deployment build completed");
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Build failed unexpectedly";
    logger.error(errorMsg);

    try {
      await publishStatus(buildId, BuildStatus.Failed);
    } catch (pubErr) {
      console.error("Failed to publish status to Redis:", pubErr);
    }

    await Builds.findOneAndUpdate(
      { build_name: buildId },
      {
        status: BuildStatus.Failed,
        finishedAt: new Date(),
      },
      { new: true }
    );
  } finally {
    try {
      await flushBuildLogs(buildId);
    } catch (err) {
      console.error(`Failed to flush logs for ${buildId}`, err);
    }

    if (workDir && fs.existsSync(workDir)) {
      logger.log("Cleaning up workspace...");
      try {
        await safeRemoveDir(workDir);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.log(`Warning: workspace cleanup incomplete (${msg})`);
      }
    }

    logger.log("Build job finished");
  }

  return logger.getLogs();
}
