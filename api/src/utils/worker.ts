import git from "simple-git";
import fs from "fs";
import { Builds, BuildStatus } from "../model/Builds.model";
import { Deployments } from "../model/Deployments.model";
import { BuildJob } from "./buildQueue";
import { makeBuildLogger } from "./logger";
import { detectArtifactPath } from "./detectArtifactPath";
import { getWorkDir } from "./getWorkDir";
import { runStreamingDocker } from "./runStreaming";
import { dockerCmd } from "./dockercmd";
import { publishLog, publishStatus, redisReady } from "./pub";
import { findProjectRoot } from "./findProjectRoot";
import uploadDirectoryToR2 from "./upload";
import path from "path";
// import delay from "./delay";

export async function processJob(job: BuildJob): Promise<string[]> {
  const {
    buildId,
    deploymentId,
    repo_url,
    slug,
    project_type,
    installCommands,
    buildCommands,
    buildDir,
    branch,
  } = job;

  const logger = makeBuildLogger(buildId);
  const startedAt = new Date();
  let workDir = "";

  try {
    await redisReady;
    // await delay(2000)
    await publishStatus(buildId, BuildStatus.Building);

    logger.log(`🚀 Starting build for `);
    logger.log(
      `📦 Repo: ${repo_url} | Slug: ${slug} | Type: ${project_type} | Build Cmd: ${buildCommands}`
    );

    // Update Builds to "Building"
    const build = await Builds.findOneAndUpdate(
      { build_name: buildId },
      { status: BuildStatus.Building, startedAt },
      { new: true }
    );
    if (!build) throw new Error(`Build with build_name ${buildId} not found`);

    // Prepare workspace
    workDir = await getWorkDir(buildId);
    // logger.log(`📁 Workspace ready: ${workDir}`);
    logger.log(`📁 Workspace ready to install and build`);

    // Clone the repo (specific branch)
    const branch = job.branch || "main";
    logger.log("📥 Cloning repository...");
    await git().clone(repo_url, workDir, ["--branch", branch, "--single-branch"]);
    logger.log(`✅ Repository cloned successfully (branch: ${branch}).`);

    // Step A: Install dependencies
    const buildDir = job.buildDir || "./";
    const fullPath = path.resolve(workDir, buildDir);
    console.log(buildDir)
    // First check if user-specified dir has package.json
    let projectRoot = "";
    if (fs.existsSync(path.join(fullPath, "package.json"))) {
      projectRoot = fullPath;
      logger.log(`📦 Using user-specified directory: ${buildDir}`);
    } else {
      logger.log(
        `🔍 package.json not found in ${buildDir}, falling back to auto-detect...`
      );
      const detected = findProjectRoot(workDir);
      if (!detected) {
        logger.error("⚠️ package.json not found anywhere. Cannot proceed.");
        throw new Error("package.json not found in repository");
      }
      projectRoot = detected;
      logger.log(`📁 Detected project root at: ${projectRoot}`);
    }

    const combinedCmd = `
echo "[INSTALL] Starting to install packages..." && \
${installCommands} && \
echo "[BUILD] Starting build process..." && \
${buildCommands}
`.trim();

    const dockerArgs = dockerCmd(projectRoot, combinedCmd, `build-${buildId}`);

    logger.log(`📦 Installing & building inside  container...`);
    await runStreamingDocker(dockerArgs, logger);
    logger.log("✅ Install & build steps completed successfully.");

    // Step C: Detect artifact output
    // logger.log("🔍 Detecting build output artifacts...");
    const artifactPath = detectArtifactPath(workDir, project_type, logger);
    if (!artifactPath) {
      logger.error("⚠️ Build output folder not found.");
      throw new Error("build output folder not found");
    }
    // logger.log(`📦 Artifacts found at: ${artifactPath}`);

    const r2KeyPrefix = `__output/${slug}/${buildId}/`;
    logger.log(`☁️ Uploading output for ${slug} `);
    await uploadDirectoryToR2(
      artifactPath,
      r2KeyPrefix,
      process.env.R2_BUCKET!,
      logger
    );
    logger.log("✅ Build uploaded successfully.");

    // Step D: Finalize build status
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

    logger.log("🎉 Build process completed successfully.");
  } catch (err: any) {
    const errorMsg = `❌ Build failed: ${err?.message || err}`;
    // await publishStatus(buildId, BuildStatus.Failed);
    logger.error(errorMsg);

    // Publish log to Redis (non-blocking for status update)
    try {
      await publishLog(buildId, errorMsg);
      await publishStatus(buildId, BuildStatus.Failed);
    } catch (pubErr) {
      console.error("⚠️ Failed to publish log to Redis:", pubErr);
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
    // Cleanup workspace
    if (workDir && fs.existsSync(workDir)) {
      logger.log("🧹 Cleaning up workspace...");
      await fs.promises.rm(workDir, { recursive: true, force: true });
      logger.log("🧼 Workspace cleaned.");
    }

    logger.log("🏁 Build job complete.");
  }

  return logger.getLogs();
}
