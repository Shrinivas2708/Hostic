import git from "simple-git";
import fs from "fs";
import { Builds, BuildStatus } from "../model/Builds.model";
import { Deployments } from "../model/Deployments.model";
import { BuildJob } from "./buildQueue";
import { makeBuildLogger, BuildLogger } from "./logger";
import { detectArtifactPath } from "./detectArtifactPath";
import { getWorkDir } from "./getWorkDir";
import { runStreamingDocker } from "./runStreaming";
import { dockerCmd } from "./dockercmd";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime";
import path from "path";
import { publishLog } from "./pub";
import { findProjectRoot } from "./findProjectRoot";

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function uploadDirectoryToR2(
  localDir: string,
  r2Prefix: string,
  bucket: string,
  logger: BuildLogger
): Promise<void> {
  const files = await fs.promises.readdir(localDir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(localDir, file.name);
    const relativePath = path.relative(localDir, fullPath);
    const r2Key = path.join(r2Prefix, relativePath).replace(/\\/g, "/");

    if (file.isDirectory()) {
      await uploadDirectoryToR2(fullPath, r2Key, bucket, logger);
    } else {
      const fileContent = await fs.promises.readFile(fullPath);
      const contentType = mime.getType(fullPath) || "application/octet-stream";

      logger.log(`Uploading ${fullPath} to ${r2Key} (Content-Type: ${contentType})`);

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: r2Key,
            Body: fileContent,
            ContentType: contentType,
          })
        );
        logger.log(`Successfully uploaded ${r2Key}`);
      } catch (err: any) {
        logger.error(`Failed to upload ${r2Key}: ${err.message}`);
        throw err;
      }
    }
  }
}

export async function processJob(job: BuildJob): Promise<string[]> {
  const { buildId, deploymentId, repo_url, slug, project_type, buildCommands } = job;
  const logger = makeBuildLogger(buildId);
  const startedAt = new Date();
  let workDir = "";

  try {
    logger.log("🟢 processJob start");
    logger.log(`repo_url=${repo_url} slug=${slug} type=${project_type}`);

    // Update Builds document by build_name
    const build = await Builds.findOneAndUpdate(
      { build_name: buildId },
      { status: BuildStatus.Building, startedAt },
      { new: true }
    );
    if (!build) {
      throw new Error(`Build with build_name ${buildId} not found`);
    }

    workDir = await getWorkDir(buildId);
    logger.log(`workspace ready: ${workDir}`);

    logger.log("cloning repo...");
    await git().clone(repo_url, workDir);
    logger.log("clone done");

    // Step A: install
const lockFilePath = path.join(workDir, "package-lock.json");
const installCommand = fs.existsSync(lockFilePath) ? "npm ci" : "npm install";

logger.log(`npm install step (command: ${installCommand})...`);
const installCmd = dockerCmd(workDir, installCommand, `install-${buildId}`);
await runStreamingDocker(installCmd, logger);


    // Step B: build
    const userBuild = buildCommands?.trim();
    const buildShell = userBuild || "npm run build";
    const buildCmd = dockerCmd(workDir, buildShell, `build-${buildId}`);
    logger.log(`build step: ${buildShell}`);
    await runStreamingDocker(buildCmd, logger);

    // Detect artifact output
    const artifactPath = detectArtifactPath(workDir, project_type, logger);
    if (!artifactPath) throw new Error("build output folder not found");

    const r2KeyPrefix = `__output/${slug}/${buildId}/`;
    logger.log(`Uploading artifacts from ${artifactPath} to R2: ${r2KeyPrefix}`);

    // Upload artifacts to R2
    await uploadDirectoryToR2(artifactPath, r2KeyPrefix, process.env.R2_BUCKET || "", logger);

    const finishedAt = new Date();
    // Update Builds document by build_name
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
    await Deployments.findByIdAndUpdate(deploymentId, { current_build_id: build._id });

    logger.log("✅ Build succeeded.");
  } catch (err: any) {
    const errorMsg = `❌ Build failed: ${err?.message || err}`;
    logger.error(errorMsg);
    await publishLog(buildId, errorMsg); // Ensure error is sent to clients
    // Update Builds document by build_name
    await Builds.findOneAndUpdate(
      { build_name: buildId },
      { status: BuildStatus.Failed, finishedAt: new Date() },
      { new: true }
    );
  } finally {
    if (workDir && fs.existsSync(workDir)) {
      logger.log("cleanup workspace...");
      await fs.promises.rm(workDir, { recursive: true, force: true });
      logger.log("workspace cleaned.");
    }
    logger.log("🟣 processJob end");
  }

  return logger.getLogs();
}