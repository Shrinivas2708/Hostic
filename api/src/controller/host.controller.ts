import { NextFunction, Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { Deployments, ProjectType } from "../model/Deployments.model";
import { BuildStatus } from "../model/Builds.model";
import { User } from "../model/User.model";
import { captureAndUploadScreenshot, Delete } from "../utils/imagesHandle";
import { getDeploymentUrl } from "../utils/urls";
import {
  generateWebhookSecret,
  triggerDeploymentBuild,
} from "../utils/triggerBuild";
import { removeDeploymentCache } from "../utils/deploymentCache";
import { deleteDepsCache, invalidateLocalDepsInstallCache } from "../utils/depsCache";
import { Builds } from "../model/Builds.model";
import {
  setupGitHubWebhookForDeployment,
  removeGitHubWebhookForDeployment,
  setGitHubWebhookActive,
  refreshGitHubWebhookSecret,
} from "../utils/githubWebhooks";

function getApiPublicUrl(): string {
  return (process.env.API_PUBLIC_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  );
}

export const deploy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      repo_url,
      project_type,
      buildCommands,
      installCommands,
      buildDir,
      branch,
    } = req.body as {
      repo_url: string;
      project_type: ProjectType;
      buildCommands?: string;
      installCommands?: string;
      buildDir?: string;
      branch?: string;
    };

    const incResult = await User.updateOne(
      { _id: user_id, deployments_count: { $lt: 3 } },
      { $inc: { deployments_count: 1 } }
    );

    if (incResult.modifiedCount === 0) {
      return res.status(403).json({ message: "Maximum deployments reached!" });
    }

    const slug = generateSlug();
    const deployment = await Deployments.create({
      user_id,
      repo_url,
      slug,
      projectType: project_type,
      buildCommands,
      installCommands,
      buildDir,
      branch: branch?.trim() || "main",
      autoDeploy: true,
      webhookSecret: generateWebhookSecret(),
    });

    try {
      const result = await triggerDeploymentBuild(deployment, {
        triggeredBy: "manual",
      });

      if (!result.ok) {
        await Deployments.findByIdAndDelete(deployment._id);
        await User.updateOne(
          { _id: user_id },
          { $inc: { deployments_count: -1 } }
        );
        return res.status(500).json({ message: result.reason });
      }

      const build = await Builds.findOne({ build_name: result.build_name });

      await setupGitHubWebhookForDeployment(deployment, user_id);

      const refreshed = await Deployments.findById(deployment._id);

      res.json({
        deployment_id: deployment._id,
        build_id: build?._id,
        build_name: result.build_name,
        slug,
        status: result.status,
        webhook_url: `${getApiPublicUrl()}/api/webhooks/github/${deployment.webhookSecret}`,
        github_webhook_managed: refreshed?.githubWebhookManaged ?? false,
      });
    } catch (err) {
      await Deployments.findByIdAndDelete(deployment._id);
      await User.updateOne(
        { _id: user_id },
        { $inc: { deployments_count: -1 } }
      );
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const redeploy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { deployment_id } = req.body as { deployment_id: string };

    const deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id,
    });

    if (!deployment) {
      return res
        .status(404)
        .json({ message: "Deployment not found or unauthorized" });
    }

    const result = await triggerDeploymentBuild(deployment, {
      triggeredBy: "manual",
    });

    if (!result.ok) {
      return res.status(400).json({ message: result.reason });
    }

    const build = await Builds.findOne({ build_name: result.build_name });

    res.json({
      deployment_id: deployment._id,
      build_id: build?._id,
      build_name: result.build_name,
      slug: deployment.slug,
      status: result.status,
    });
  } catch (err) {
    next(err);
  }
};

export const getWebhookInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    const { deployment_id } = req.query;

    const deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id,
    });

    if (!deployment) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    if (!deployment.webhookSecret) {
      deployment.webhookSecret = generateWebhookSecret();
      await deployment.save();
    }

    const webhookUrl = `${getApiPublicUrl()}/api/webhooks/github/${deployment.webhookSecret}`;

    res.status(200).json({
      webhook_url: webhookUrl,
      webhook_secret: deployment.webhookSecret,
      auto_deploy: deployment.autoDeploy ?? true,
      branch: deployment.branch,
      last_webhook_at: deployment.lastWebhookAt,
      github_webhook_managed: deployment.githubWebhookManaged ?? false,
      github_repo: deployment.githubRepoFullName ?? null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAutoDeploy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    const { deployment_id, auto_deploy } = req.body as {
      deployment_id: string;
      auto_deploy: boolean;
    };

    const deployment = await Deployments.findOneAndUpdate(
      { _id: deployment_id, user_id },
      { autoDeploy: auto_deploy },
      { new: true }
    );

    if (!deployment) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    if (deployment.githubWebhookManaged) {
      await setGitHubWebhookActive(deployment, user_id!, auto_deploy);
    }

    res.status(200).json({
      message: "Auto-deploy updated",
      auto_deploy: deployment.autoDeploy,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    const {
      deployment_id,
      branch,
      buildDir,
      project_type,
      installCommands,
      buildCommands,
      auto_deploy,
    } = req.body as {
      deployment_id: string;
      branch?: string;
      buildDir?: string;
      project_type?: ProjectType;
      installCommands?: string;
      buildCommands?: string;
      auto_deploy?: boolean;
    };

    if (!deployment_id) {
      return res.status(400).json({ message: "deployment_id is required" });
    }

    const existing = await Deployments.findOne({
      _id: deployment_id,
      user_id,
    });

    if (!existing) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    const updates: Record<string, string | boolean> = {};
    let invalidateDeps = false;

    if (branch !== undefined) {
      updates.branch = branch.trim() || "main";
    }
    if (buildDir !== undefined) {
      const nextDir = buildDir.trim() || "./";
      const prevDir = existing.buildDir?.trim() || "./";
      if (nextDir !== prevDir) invalidateDeps = true;
      updates.buildDir = nextDir;
    }
    if (project_type !== undefined) {
      if (!Object.values(ProjectType).includes(project_type)) {
        return res.status(400).json({ message: "Invalid project type" });
      }
      updates.projectType = project_type;
    }
    if (installCommands !== undefined) {
      if (installCommands.trim() !== (existing.installCommands ?? "").trim()) {
        invalidateDeps = true;
      }
      updates.installCommands = installCommands;
    }
    if (buildCommands !== undefined) {
      updates.buildCommands = buildCommands;
    }
    if (auto_deploy !== undefined) {
      updates.autoDeploy = auto_deploy;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No settings to update" });
    }

    const deployment = await Deployments.findOneAndUpdate(
      { _id: deployment_id, user_id },
      { $set: updates },
      { new: true }
    );

    if (!deployment) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    if (invalidateDeps) {
      await invalidateLocalDepsInstallCache(deployment_id);
    }

    if (
      auto_deploy !== undefined &&
      deployment.githubWebhookManaged &&
      user_id
    ) {
      await setGitHubWebhookActive(deployment, user_id, auto_deploy);
    }

    res.status(200).json({ deployment });
  } catch (error) {
    next(error);
  }
};

export const regenerateWebhookSecret = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    const { deployment_id } = req.body as { deployment_id: string };

    const deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id,
    });

    if (!deployment) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    const newSecret = generateWebhookSecret();
    deployment.webhookSecret = newSecret;
    await deployment.save();

    if (deployment.githubWebhookManaged && user_id) {
      await refreshGitHubWebhookSecret(deployment, user_id, newSecret);
    }

    res.status(200).json({
      message: "Webhook secret regenerated",
      webhook_url: `${getApiPublicUrl()}/api/webhooks/github/${deployment.webhookSecret}`,
      webhook_secret: deployment.webhookSecret,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  try {
    const deployments = await Deployments.find({ user_id }).select(
      "_id slug img_url autoDeploy"
    );
    if (!deployments) {
      res.status(401).json({ meesage: "No deployments!" });
    }
    res.status(200).json({ deployments });
  } catch (error) {
    next(error);
  }
};

export const getDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  const { deployment_id } = req.query;
  try {
    let deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id: user_id,
    });
    if (!deployment) {
      res.status(401).json({ meesage: "No deployments!" });
      return;
    }

    const user = await User.findById(user_id).select("+githubAccessToken");
    if (user_id && user?.githubAccessToken && !deployment.githubWebhookManaged) {
      await setupGitHubWebhookForDeployment(deployment, user_id);
      deployment = await Deployments.findById(deployment._id);
    }

    res.status(200).json({ deployment });
  } catch (error) {
    next(error);
  }
};

export const getBuild = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { build_name } = req.query;
  try {
    const build = await Builds.findOne({ build_name });
    if (!build) {
      res.status(401).json({ meesage: "No deployments!" });
    }
    res.status(200).json({ build });
  } catch (error) {
    next(error);
  }
};

export const deleteDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  const { deployment_id } = req.body;

  if (!user_id || !deployment_id) {
    return res.status(400).json({ message: "deployment_id is required" });
  }

  try {
    const deployment = await Deployments.findOneAndDelete({
      _id: deployment_id,
      user_id,
    });

    if (!deployment) {
      return res.status(404).json({ message: "Deployment not found" });
    }

    await removeGitHubWebhookForDeployment(deployment, user_id);

    await Builds.deleteMany({ deployment_id });

    await removeDeploymentCache(deployment_id);

    try {
      await deleteDepsCache(deployment.slug);
    } catch (err) {
      console.warn("Failed to delete dependency cache from storage:", err);
    }

    if (deployment.img_id) {
      try {
        await Delete(deployment.img_id);
      } catch (err) {
        console.warn("⚠️ Failed to delete preview image:", err);
      }
    }

    await User.updateOne(
      { _id: user_id, deployments_count: { $gt: 0 } },
      { $inc: { deployments_count: -1 } }
    );

    return res.status(200).json({ message: "Deployment deleted successfully!" });
  } catch (error) {
    next(error);
  }
};

export const getBuildsForDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deployment_id = req.query.deployment_id as string;

    if (!deployment_id) {
      return res.status(400).json({ message: "deployment_id is required" });
    }

    const builds = await Builds.find({ deployment_id }).select("-logs");

    res.status(200).json({ builds });
  } catch (error) {
    next(error);
  }
};

export const getImgForBuild = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  const { deployment_id } = req.body;

  if (!user_id || !deployment_id) {
    return res.status(400).json({ error: "Missing user_id or deployment_id" });
  }

  try {
    const Deployment = await Deployments.findById(deployment_id);
    if (!Deployment)
      return res.status(404).json({ error: "Deployment not found" });

    const Build = await Builds.findById(Deployment.current_build_id);
    if (!Build) return res.status(404).json({ error: "Build not found" });

    const name = `${Deployment.slug}&${Build.build_name}`;
    const url = getDeploymentUrl(Deployment.slug);

    if (
      Deployment.img_url &&
      Deployment.img_id &&
      Deployment.image_build_id?.toString() === Build._id.toString()
    ) {
      return res.status(200).json({
        message: "Image already exists for current build",
        url: Deployment.img_url,
      });
    }

    if (Deployment.img_id) {
      try {
        await Delete(Deployment.img_id);
      } catch (err) {
        console.warn("⚠️ Failed to delete old image:", err);
      }
    }

    try {
      const data = await captureAndUploadScreenshot(url, name);
      await Deployments.updateOne(
        { _id: Deployment._id },
        {
          img_url: data.url,
          img_id: data.fileId,
          image_build_id: Build._id,
        }
      );
      return res.status(200).json({
        message: "Image captured for current build",
        url: data.url,
      });
    } catch (error) {
      console.error("❌ Screenshot Upload Error:", error);
      return next(new Error("Failed to capture or upload screenshot"));
    }
  } catch (err) {
    console.error("❌ Unexpected Error in getImgForBuild:", err);
    return next(err);
  }
};
