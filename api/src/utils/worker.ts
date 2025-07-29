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
import { publishLog } from "./pub";
import { findProjectRoot } from "./findProjectRoot";
import uploadDirectoryToR2 from "./upload";

export async function processJob(job: BuildJob): Promise<string[]> {
  const {
    buildId,
    deploymentId,
    repo_url,
    slug,
    project_type,
    installCommands,
    buildCommands,
  } = job;

  const logger = makeBuildLogger(buildId);
  const startedAt = new Date();
  let workDir = "";

  try {
    logger.log(`🚀 Starting build`);
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

    // Clone the repo
    logger.log("📥 Cloning repository...");
    await git().clone(repo_url, workDir);
    logger.log("✅ Repository cloned successfully.");

    // Step A: Install dependencies
    logger.log("📄 Searching for package.json...");
    const projectRoot = findProjectRoot(workDir);
    if (!projectRoot) {
      logger.error("⚠️ package.json not found. Cannot proceed.");
      throw new Error("package.json not found in repository");
    }

    const installCmd = dockerCmd(
      projectRoot,
      installCommands!,
      `install-${buildId}`
    );
    logger.log("📦 Installing dependencies");
    await runStreamingDocker(installCmd, logger);
    logger.log("✅ Dependencies installed successfully.");

    // Step B: Run user build command
    const userBuild = buildCommands?.trim();
    const buildShell = userBuild || "npm run build";
    const buildCmd = dockerCmd(workDir, buildShell, `build-${buildId}`);
    logger.log(`🛠️ Running build step: "${buildShell}" inside Docker...`);
    await runStreamingDocker(buildCmd, logger);
    logger.log("✅ Build step completed successfully.");

    // Step C: Detect artifact output
    // logger.log("🔍 Detecting build output artifacts...");
    const artifactPath = detectArtifactPath(workDir, project_type, logger);
    if (!artifactPath) {
      logger.error("⚠️ Build output folder not found.");
      throw new Error("build output folder not found");
    }
    logger.log(`📦 Artifacts found at: ${artifactPath}`);

    const r2KeyPrefix = `__output/${slug}/${buildId}/`;
    logger.log(`☁️ Uploading output for ${slug} `);
    await uploadDirectoryToR2(
      artifactPath,
      r2KeyPrefix,
      process.env.R2_BUCKET || "",
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

    logger.log("🎉 Build process completed successfully.");
  } catch (err: any) {
    const errorMsg = `❌ Build failed: ${err?.message || err}`;
    logger.error(errorMsg);

    // Publish log to Redis (non-blocking for status update)
    try {
      await publishLog(buildId, errorMsg);
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
