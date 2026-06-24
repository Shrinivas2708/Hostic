import { PutObjectCommand } from "@aws-sdk/client-s3";
import { BuildLogger } from "./logger";
import fs from "fs";
import mime from "mime";
import path from "path";
import { getR2Bucket, r2Client } from "./r2Client";

export default async function uploadDirectoryToR2(
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

      try {
        await r2Client.send(
          new PutObjectCommand({
            Bucket: bucket || getR2Bucket(),
            Key: r2Key,
            Body: fileContent,
            ContentType: contentType,
          })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to upload ${r2Key}: ${message}`);
        throw err;
      }
    }
  }
}