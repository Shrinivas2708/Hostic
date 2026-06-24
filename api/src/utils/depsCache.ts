import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { createReadStream, createWriteStream } from "fs";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import type { BuildLogger } from "./logger";
import { runDockerQuiet, safeRemoveDir, toDockerVolumePath } from "./dockerFs";
import { getR2Bucket, r2Client } from "./r2Client";

const DEPS_PREFIX = "__deps";
const ARCHIVE_FILENAME = ".hostic-deps.tar.gz";

export type DepsCacheMeta = {
  lockfileHash: string;
  lockfile: string;
  projectRootRel: string;
  archiveKey: string;
  updatedAt: string;
};

function depsMetaKey(slug: string): string {
  return `${DEPS_PREFIX}/${slug}/meta.json`;
}

function depsArchiveKey(slug: string, lockfileHash: string): string {
  return `${DEPS_PREFIX}/${slug}/${lockfileHash}.tar.gz`;
}

async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

export async function fetchDepsCacheMeta(
  slug: string
): Promise<DepsCacheMeta | null> {
  try {
    const res = await r2Client.send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: depsMetaKey(slug),
      })
    );
    const body = await res.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as DepsCacheMeta;
  } catch {
    return null;
  }
}

export async function canReuseDepsFromR2(
  slug: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string
): Promise<DepsCacheMeta | null> {
  const meta = await fetchDepsCacheMeta(slug);
  if (!meta) return null;
  if (meta.lockfileHash !== lockfileInfo.hash) return null;
  if (meta.projectRootRel !== projectRootRel) return null;
  if (!(await objectExists(meta.archiveKey))) return null;
  return meta;
}

async function createDepsArchive(
  projectRoot: string,
  logger: BuildLogger
): Promise<string> {
  const archivePath = path.join(projectRoot, ARCHIVE_FILENAME);
  const vol = toDockerVolumePath(projectRoot);

  if (fs.existsSync(archivePath)) {
    await fs.promises.unlink(archivePath);
  }

  logger.log("Packaging node_modules for storage...");
  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${vol}:/app`,
    "-w",
    "/app",
    "node:20",
    "sh",
    "-c",
    `tar -czf ${ARCHIVE_FILENAME} node_modules`,
  ]);

  return archivePath;
}

async function extractDepsArchive(
  projectRoot: string,
  archivePath: string,
  logger: BuildLogger
): Promise<void> {
  const vol = toDockerVolumePath(projectRoot);

  if (fs.existsSync(path.join(projectRoot, "node_modules"))) {
    await safeRemoveDir(path.join(projectRoot, "node_modules"));
  }

  logger.log("Extracting dependencies into workspace...");
  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${vol}:/app`,
    "-w",
    "/app",
    "node:20",
    "sh",
    "-c",
    `tar -xzf ${ARCHIVE_FILENAME}`,
  ]);
}

export async function restoreDepsFromR2(
  slug: string,
  meta: DepsCacheMeta,
  projectRoot: string,
  logger: BuildLogger
): Promise<void> {
  const archivePath = path.join(projectRoot, ARCHIVE_FILENAME);

  logger.log("Downloading cached dependencies from storage...");
  const res = await r2Client.send(
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: meta.archiveKey,
    })
  );

  if (!res.Body) {
    throw new Error("Empty dependency archive in storage");
  }

  await pipeline(
    res.Body as NodeJS.ReadableStream,
    createWriteStream(archivePath)
  );

  await extractDepsArchive(projectRoot, archivePath, logger);

  await fs.promises.unlink(archivePath).catch(() => undefined);
  logger.success("Dependencies restored from storage");
}

export async function saveDepsToR2(
  slug: string,
  projectRoot: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<void> {
  const modulesDir = path.join(projectRoot, "node_modules");
  if (!fs.existsSync(modulesDir)) return;

  const archiveKey = depsArchiveKey(slug, lockfileInfo.hash);
  const archivePath = await createDepsArchive(projectRoot, logger);

  try {
    logger.log("Uploading dependency cache to storage...");
    await r2Client.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: archiveKey,
        Body: createReadStream(archivePath),
        ContentType: "application/gzip",
      })
    );

    const meta: DepsCacheMeta = {
      lockfileHash: lockfileInfo.hash,
      lockfile: lockfileInfo.file,
      projectRootRel,
      archiveKey,
      updatedAt: new Date().toISOString(),
    };

    await r2Client.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: depsMetaKey(slug),
        Body: JSON.stringify(meta),
        ContentType: "application/json",
      })
    );

    logger.success("Dependencies saved to storage for future builds");
  } finally {
    await fs.promises.unlink(archivePath).catch(() => undefined);
  }
}

export async function deleteDepsCache(slug: string): Promise<void> {
  const bucket = getR2Bucket();
  const prefix = `${DEPS_PREFIX}/${slug}/`;
  let continuationToken: string | undefined;

  do {
    const listing = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const keys =
      listing.Contents?.map((item) => item.Key).filter(
        (key): key is string => !!key
      ) ?? [];

    if (keys.length > 0) {
      await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
    }

    continuationToken = listing.IsTruncated
      ? listing.NextContinuationToken
      : undefined;
  } while (continuationToken);
}
