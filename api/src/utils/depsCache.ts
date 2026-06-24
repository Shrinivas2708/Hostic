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
import { getDeploymentCacheDir } from "./deploymentCache";
import { getR2Bucket, r2Client } from "./r2Client";

const DEPS_PREFIX = "__deps";
export const NPM_CACHE_DIRNAME = ".hostic-npm-cache";
const ARCHIVE_FILENAME = ".hostic-npm-cache.tar";
const CACHE_VERSION = 2;
const LOCAL_META_FILE = "deps-meta.json";

export type DepsCacheMeta = {
  version: typeof CACHE_VERSION;
  lockfileHash: string;
  lockfile: string;
  projectRootRel: string;
  archiveKey?: string;
  updatedAt: string;
};

function shouldSyncR2(): boolean {
  return process.env.DEPS_CACHE_SYNC_R2 === "true";
}

export function localNpmCacheDir(deploymentId: string): string {
  return path.join(getDeploymentCacheDir(deploymentId), "npm-cache");
}

export function getNpmCacheContainerPath(): string {
  return `/app/${NPM_CACHE_DIRNAME}`;
}

export async function ensureNpmCacheDir(deploymentId: string): Promise<string> {
  const dir = localNpmCacheDir(deploymentId);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

function localMetaPath(deploymentId: string): string {
  return path.join(getDeploymentCacheDir(deploymentId), LOCAL_META_FILE);
}

function depsMetaKey(slug: string): string {
  return `${DEPS_PREFIX}/${slug}/meta.json`;
}

function depsArchiveKey(slug: string, lockfileHash: string): string {
  return `${DEPS_PREFIX}/${slug}/${lockfileHash}.npm-cache.tar`;
}

function readLocalMeta(deploymentId: string): DepsCacheMeta | null {
  const metaPath = localMetaPath(deploymentId);
  if (!fs.existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(
      fs.readFileSync(metaPath, "utf8")
    ) as DepsCacheMeta;
    return meta.version === CACHE_VERSION ? meta : null;
  } catch {
    return null;
  }
}

function metaMatches(
  meta: DepsCacheMeta,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string
): boolean {
  return (
    meta.lockfileHash === lockfileInfo.hash &&
    meta.projectRootRel === projectRootRel
  );
}

async function cacheDirHasEntries(dir: string): Promise<boolean> {
  try {
    const entries = await fs.promises.readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
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

async function fetchR2DepsMeta(slug: string): Promise<DepsCacheMeta | null> {
  try {
    const res = await r2Client.send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: depsMetaKey(slug),
      })
    );
    const body = await res.Body?.transformToString();
    if (!body) return null;
    const meta = JSON.parse(body) as DepsCacheMeta;
    return meta.version === CACHE_VERSION ? meta : null;
  } catch {
    return null;
  }
}

/** Shell prefix: npm uses this cache dir inside the Docker /app mount. */
export function npmCacheShellEnv(preferOffline: boolean): string {
  const offline = preferOffline ? "npm_config_prefer_offline=true " : "";
  return `export npm_config_cache=${getNpmCacheContainerPath()} && ${offline}`;
}

export function buildInstallCommand(
  installCommands: string,
  preferOffline: boolean
): string {
  return `
echo "[INSTALL] Installing packages..." && \
${npmCacheShellEnv(preferOffline)} \
${installCommands}
`.trim();
}

async function restoreLocalNpmCache(
  deploymentId: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<boolean> {
  const meta = readLocalMeta(deploymentId);
  const cacheDir = localNpmCacheDir(deploymentId);
  if (!meta || !metaMatches(meta, lockfileInfo, projectRootRel)) return false;
  if (!(await cacheDirHasEntries(cacheDir))) return false;

  logger.log("Using persisted npm cache (mounted into container)...");
  logger.success(
    `npm cache ready — ${meta.lockfile} unchanged, using prefer-offline`
  );
  return true;
}

async function writeLocalMeta(
  deploymentId: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  archiveKey?: string
): Promise<void> {
  const meta: DepsCacheMeta = {
    version: CACHE_VERSION,
    lockfileHash: lockfileInfo.hash,
    lockfile: lockfileInfo.file,
    projectRootRel,
    archiveKey,
    updatedAt: new Date().toISOString(),
  };
  await fs.promises.mkdir(getDeploymentCacheDir(deploymentId), {
    recursive: true,
  });
  await fs.promises.writeFile(
    localMetaPath(deploymentId),
    JSON.stringify(meta, null, 2)
  );
}

async function saveLocalNpmCache(
  deploymentId: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<void> {
  const cacheDir = localNpmCacheDir(deploymentId);
  if (!(await cacheDirHasEntries(cacheDir))) return;

  await writeLocalMeta(deploymentId, lockfileInfo, projectRootRel);
  logger.log("npm cache metadata updated (cache stays on disk for next build)");
}

async function createNpmCacheArchive(cacheDir: string): Promise<string> {
  if (!fs.existsSync(cacheDir)) {
    throw new Error("npm cache directory not found");
  }

  const parent = path.dirname(cacheDir);
  const archivePath = path.join(parent, ARCHIVE_FILENAME);
  const vol = toDockerVolumePath(parent);
  const cacheName = path.basename(cacheDir);

  if (fs.existsSync(archivePath)) {
    await fs.promises.unlink(archivePath);
  }

  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${vol}:/data`,
    "-w",
    "/data",
    "node:20",
    "sh",
    "-c",
    `tar -cf ${ARCHIVE_FILENAME} ${cacheName}`,
  ]);

  return archivePath;
}

async function extractNpmCacheArchive(
  parentDir: string,
  cacheDirName: string
): Promise<void> {
  const vol = toDockerVolumePath(parentDir);
  const cacheDir = path.join(parentDir, cacheDirName);

  if (fs.existsSync(cacheDir)) {
    await safeRemoveDir(cacheDir);
  }

  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${vol}:/data`,
    "-w",
    "/data",
    "node:20",
    "sh",
    "-c",
    `tar -xf ${ARCHIVE_FILENAME}`,
  ]);
}

async function restoreFromR2(
  deploymentId: string,
  meta: DepsCacheMeta,
  logger: BuildLogger
): Promise<void> {
  if (!meta.archiveKey) throw new Error("Missing R2 archive key");

  const parentDir = getDeploymentCacheDir(deploymentId);
  const archivePath = path.join(parentDir, ARCHIVE_FILENAME);
  logger.log("Downloading npm cache from R2...");

  const res = await r2Client.send(
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: meta.archiveKey,
    })
  );

  if (!res.Body) throw new Error("Empty npm cache archive in R2");

  await pipeline(
    res.Body as NodeJS.ReadableStream,
    createWriteStream(archivePath)
  );

  logger.log("Extracting npm cache...");
  await extractNpmCacheArchive(parentDir, "npm-cache");
  await fs.promises.unlink(archivePath).catch(() => undefined);

  logger.success("npm cache restored from R2 — using prefer-offline");
}

async function uploadToR2(
  deploymentId: string,
  slug: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<void> {
  const cacheDir = localNpmCacheDir(deploymentId);
  const archiveKey = depsArchiveKey(slug, lockfileInfo.hash);
  const archivePath = await createNpmCacheArchive(cacheDir);

  try {
    const { size } = await fs.promises.stat(archivePath);
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    logger.log(`Uploading npm cache to R2 (${sizeMb} MB)...`);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: archiveKey,
        Body: createReadStream(archivePath),
        ContentType: "application/x-tar",
      })
    );

    await writeLocalMeta(
      deploymentId,
      lockfileInfo,
      projectRootRel,
      archiveKey
    );

    logger.log("npm cache synced to R2");
  } finally {
    await fs.promises.unlink(archivePath).catch(() => undefined);
  }
}

/** Check local (mounted) cache, then optional R2. Returns whether prefer-offline applies. */
export async function restoreDepsCache(
  deploymentId: string,
  slug: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<boolean> {
  if (
    await restoreLocalNpmCache(
      deploymentId,
      lockfileInfo,
      projectRootRel,
      logger
    )
  ) {
    return true;
  }

  const r2Meta = await fetchR2DepsMeta(slug);
  if (
    !r2Meta ||
    !metaMatches(r2Meta, lockfileInfo, projectRootRel) ||
    !r2Meta.archiveKey ||
    !(await objectExists(r2Meta.archiveKey))
  ) {
    return false;
  }

  try {
    await restoreFromR2(deploymentId, r2Meta, logger);
    await writeLocalMeta(
      deploymentId,
      lockfileInfo,
      projectRootRel,
      r2Meta.archiveKey
    );
    return true;
  } catch {
    return false;
  }
}

export async function saveDepsCache(
  deploymentId: string,
  slug: string,
  lockfileInfo: { hash: string; file: string },
  projectRootRel: string,
  logger: BuildLogger
): Promise<void> {
  try {
    await saveLocalNpmCache(
      deploymentId,
      lockfileInfo,
      projectRootRel,
      logger
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.log(`Could not save local npm cache (${msg})`);
  }

  if (!shouldSyncR2()) return;

  try {
    await uploadToR2(
      deploymentId,
      slug,
      lockfileInfo,
      projectRootRel,
      logger
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.log(`Could not sync npm cache to R2 (${msg})`);
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
