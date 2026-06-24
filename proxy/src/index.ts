require("dotenv").config();
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { request as httpsRequest } from "https";
import { pipeline } from "stream";
import path from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Deployments, IDeployment } from "./model/Deployments.model";
import { Builds, BuildStatus } from "./model/Builds.model";
import {
  getAppsDomain,
  resolveRequestTarget,
  resolveRequestedFile,
  usesPathRouting,
} from "./config";

const app = express();
const PORT = process.env.PORT || 8080;
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  "https://2b086fbe3c7ee18f666646ea5178c5e2.r2.cloudflarestorage.com";
const MONGODB_URI = process.env.DATABASE_URL;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY =
  process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const PUBLIC_PATH = path.resolve(__dirname, "..", "public");

if (!R2_ACCESS_KEY || !R2_SECRET_KEY) {
  throw new Error(
    "Missing R2_ACCESS_KEY or R2_SECRET_KEY environment variables"
  );
}
if(!MONGODB_URI){
  throw new Error("Missing Mongo URI!!")
}
const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

mongoose
  .connect(MONGODB_URI)
  .catch((err) => console.error("MongoDB connection error:", err));

// Trust proxy so we can read x-forwarded-host
app.set("trust proxy", true);

function getOriginalHostname(req: Request): string {
  return (
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers["x-original-host"] as string) ||
    req.hostname
  );
}

function resolveRequestedFilePath(reqPath: string): string {
  return resolveRequestedFile(reqPath);
}

app.use(async (req: Request, res: Response) => {
  try {
    const hostname = getOriginalHostname(req);
    const target = resolveRequestTarget(hostname, req.path);

    if (!target) {
      if (usesPathRouting()) {
        res.status(404).send(
          "Not found. Ngrok path mode: use https://<your-proxy-ngrok>/d/<slug>/"
        );
        return;
      }
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    const { slug, assetPath } = target;
    console.log(
      `Incoming host=${hostname} slug=${slug} appsDomain=${getAppsDomain()} path=${assetPath}`
    );

    const deployment: IDeployment | null = await Deployments.findOne({ slug });
    console.log("Deployment Found = " + deployment)
    if (!deployment?.current_build_id) {
      console.log(`Deployment not found for slug: ${slug}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    const build = await Builds.findById(deployment.current_build_id);

    if (!build) {
      console.log(`Build not found for ${deployment.current_build_id}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    // Show building page if build is still queued or in progress
    if (
      build.status === BuildStatus.Building ||
      build.status === BuildStatus.Queued
    ) {
      res.status(200).sendFile(path.join(PUBLIC_PATH, "building.html"));
      return;
    }

    // No artifact means no successful build
    if (build.status !== BuildStatus.Success || !build.artifact_path) {
      console.log(`No successful build for ${deployment.current_build_id}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    if (!build?.artifact_path) {
      console.log(`No successful build for ${deployment.current_build_id}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    const artifactBase = build.artifact_path.replace(/^\/+|\/+$/g, "");
    const filePath = resolveRequestedFilePath(assetPath);
    const fileKey = `${artifactBase}${filePath}`.replace(/^\/+/, "");

    console.log(`Requested Path: ${req.path} -> fileKey=${fileKey}`);

    const r2Url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: fileKey }),
      { expiresIn: 3600 }
    );
    console.log(`Signed URL: ${r2Url}`);

    const r2Req = httpsRequest(r2Url, { method: "GET" });

    r2Req.on("response", (r2Resp) => {
      if (r2Resp.statusCode !== 200) {
        console.log(`R2 responded ${r2Resp.statusCode} for ${fileKey}`);
        res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
        return;
      }

      res.set({
        "Content-Type":
          r2Resp.headers["content-type"] || "application/octet-stream",
        "Content-Length": r2Resp.headers["content-length"],
        "Cache-Control": "public, max-age=3600",
      });

      pipeline(r2Resp, res, (err: any) => {
        if (err) console.error("Streaming error:", err);
      });
    });

    r2Req.on("error", (err) => {
      console.error("R2 request error:", err);
      if (!res.headersSent) res.status(500).send("Error connecting to R2");
    });

    r2Req.end();
  } catch (err) {
    console.error("Proxy error:", err);
    if (!res.headersSent) res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  const mode = usesPathRouting()
    ? "path mode (/d/{slug}/) — for ngrok"
    : `subdomain mode (*.${getAppsDomain()})`;
  console.log(`Proxy server on port ${PORT} (${mode})`);
});
