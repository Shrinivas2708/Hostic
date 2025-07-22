require("dotenv").config();
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { request } from "https";
import { pipeline } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Deployments, IDeployment } from "./model/Deployments.model";
import { Builds, BuildStatus } from "./model/Builds.model";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8000;
const BASE_PATH = "https://2b086fbe3c7ee18f666646ea5178c5e2.r2.cloudflarestorage.com";
const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/your-db";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "hostit";

// Define the absolute path to the public folder
const PUBLIC_PATH = path.resolve(__dirname, "..", "public");

if (!R2_ACCESS_KEY || !R2_SECRET_KEY) {
  throw new Error("Missing R2_ACCESS_KEY or R2_SECRET_KEY environment variables");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: BASE_PATH,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

mongoose.connect(MONGODB_URI).catch((err) => console.error("MongoDB connection error:", err));

app.use(async (req: Request, res: Response) => {
  try {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0]; // e.g., "drab-millions-child" or "chubby-whining-airplane"
    console.log(`Processing request for subdomain: ${subdomain}`);

    const deployment: IDeployment | null = await Deployments.findOne({ slug: subdomain });
    if (!deployment || !deployment.current_build_id) {
      console.log(`Deployment not found for slug: ${subdomain}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    const build = await Builds.findOne({
      _id: deployment.current_build_id,
      status: BuildStatus.Success,
    });
    if (!build || !build.artifact_path) {
      console.log(`Successful build not found for build_id: ${deployment.current_build_id}`);
      res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
      return;
    }

    let basePath = build.artifact_path.replace(/^\/|\/$/g, ""); // Remove leading and trailing slashes
    const filePath = req.path === "/" ? "/index.html" : req.path; // Serve index.html for root
    const fileKey = `${basePath}${filePath}`.replace(/^\/|\/$/g, ""); // Ensure no extra slashes
    console.log(`Requested Path: ${req.path}, Constructed File Key: ${fileKey}`);

    const r2Url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: fileKey }),
      { expiresIn: 3600 }
    );
    console.log(`Signed URL: ${r2Url}`);

    const r2Request = request(r2Url, { method: "GET" });

    r2Request.on("response", (r2Response) => {
      if (r2Response.statusCode !== 200) {
        console.log(`R2 response error: ${r2Response.statusCode}, URL: ${r2Url}`);
        res.status(404).sendFile(path.join(PUBLIC_PATH, "404.html"));
        return;
      }

      res.set({
        "Content-Type": r2Response.headers["content-type"] || "text/html",
        "Content-Length": r2Response.headers["content-length"],
        "Cache-Control": "public, max-age=3600",
      });

      pipeline(r2Response, res, (err) => {
        if (err) {
          console.error("Streaming error:", err);
          res.status(500).send("Error streaming file");
        }
      });
    });

    r2Request.on("error", (err) => {
      console.error("R2 request error:", err);
      res.status(500).send("Error connecting to R2");
    });

    r2Request.end();
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});