import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { Deployments } from "../model/Deployments.model";
import { normalizeGitHubRepo, parsePushBranch } from "../utils/repoUtils";
import { triggerDeploymentBuild } from "../utils/triggerBuild";

function verifyGitHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export const handleGitHubWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { webhookSecret } = req.params;
    const deployment = await Deployments.findOne({ webhookSecret });

    if (!deployment) {
      return res.status(404).json({ message: "Unknown webhook" });
    }

    const rawBody = req.body as Buffer;
    const signature = req.headers["x-hub-signature-256"] as string | undefined;

    if (!verifyGitHubSignature(rawBody, signature, deployment.webhookSecret!)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = req.headers["x-github-event"] as string | undefined;

    if (event === "ping") {
      return res.status(200).json({ message: "pong" });
    }

    if (event !== "push") {
      return res.status(200).json({ message: `Ignored event: ${event}` });
    }

    if (!deployment.autoDeploy) {
      return res.status(200).json({ message: "Auto-deploy is disabled" });
    }

    const payload = JSON.parse(rawBody.toString());
    const pushedBranch = parsePushBranch(payload.ref);

    if (!pushedBranch || pushedBranch !== deployment.branch) {
      return res.status(200).json({
        message: `Ignored push to branch "${pushedBranch ?? "unknown"}" (watching "${deployment.branch}")`,
      });
    }

    const repoFullName = payload.repository?.full_name?.toLowerCase();
    const expectedRepo = normalizeGitHubRepo(deployment.repo_url);

    if (expectedRepo && repoFullName && repoFullName !== expectedRepo) {
      return res.status(200).json({ message: "Ignored push from different repository" });
    }

    const result = await triggerDeploymentBuild(deployment, {
      triggeredBy: "webhook",
    });

    if (!result.ok) {
      return res.status(200).json({ message: result.reason });
    }

    await Deployments.updateOne(
      { _id: deployment._id },
      { lastWebhookAt: new Date() }
    );

    console.log(
      `[Webhook] Triggered build ${result.build_name} for deployment ${deployment.slug}`
    );

    return res.status(200).json({
      message: "Build triggered",
      build_name: result.build_name,
      deployment_id: result.deployment_id,
    });
  } catch (err) {
    next(err);
  }
};
