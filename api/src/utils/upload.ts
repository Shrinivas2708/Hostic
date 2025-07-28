import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BuildLogger } from "./logger";
import fs from "fs"
import mime from "mime";
import path from "path";
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});
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