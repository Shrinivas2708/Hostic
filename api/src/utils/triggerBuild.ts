import crypto from "crypto";
import shortid from "shortid";
import { Deployments, IDeployment } from "../model/Deployments.model";
import { Builds, BuildStatus } from "../model/Builds.model";
import { enqueueBuild } from "./buildQueue";

export const MAX_BUILDS_PER_DEPLOYMENT = 50;

export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

export type TriggerBuildResult =
  | {
      ok: true;
      build_name: string;
      build_id: string;
      deployment_id: string;
      slug: string;
      status: BuildStatus;
    }
  | { ok: false; reason: string };

export async function triggerDeploymentBuild(
  deployment: IDeployment,
  options?: { triggeredBy?: "manual" | "webhook" }
): Promise<TriggerBuildResult> {
  const buildNo = deployment.buildNo ?? 0;
  if (buildNo >= MAX_BUILDS_PER_DEPLOYMENT) {
    return { ok: false, reason: "Max builds reached for this deployment" };
  }

  const buildName = shortid.generate();
  const build = await Builds.create({
    deployment_id: deployment._id,
    build_name: buildName,
    status: BuildStatus.Queued,
    triggeredBy: options?.triggeredBy ?? "manual",
  });

  await Deployments.updateOne({ _id: deployment._id }, { $inc: { buildNo: 1 } });

  enqueueBuild({
    buildId: build.build_name,
    deploymentId: deployment._id.toString(),
    userId: deployment.user_id.toString(),
    repo_url: deployment.repo_url,
    slug: deployment.slug,
    project_type: deployment.projectType,
    buildCommands: deployment.buildCommands,
    installCommands: deployment.installCommands,
    buildDir: deployment.buildDir,
    branch: deployment.branch || "main",
  });

  return {
    ok: true,
    build_name: buildName,
    build_id: build._id.toString(),
    deployment_id: deployment._id.toString(),
    slug: deployment.slug,
    status: BuildStatus.Queued,
  };
}
