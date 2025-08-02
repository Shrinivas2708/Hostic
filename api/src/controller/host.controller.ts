import { NextFunction, Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { Deployments, ProjectType } from "../model/Deployments.model";
import { Builds, BuildStatus } from "../model/Builds.model";
import { User } from "../model/User.model";
import { enqueueBuild } from "../utils/buildQueue";
import shortid from "shortid";
import { captureAndUploadScreenshot, Delete } from "../utils/imagesHandle";

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

    const { repo_url, project_type, buildCommands, installCommands, buildDir } =
      req.body as {
        repo_url: string;
        project_type: ProjectType;
        buildCommands?: string;
        installCommands?: string;
        buildDir?: string;
      };

    // Enforce user deployment quota
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
    });

    // Create build row with short build_name
    const buildName = shortid.generate();
    const build = await Builds.create({
      deployment_id: deployment._id,
      build_name: buildName,
      status: BuildStatus.Queued,
    });

    try {
      console.log(`${installCommands} && ${buildCommands}`);
      // Queue job for worker
      enqueueBuild({
        buildId: build.build_name,
        deploymentId: deployment._id.toString(),
        userId: user_id.toString(),
        repo_url,
        slug,
        project_type,
        buildCommands,
        installCommands,
        buildDir,
      });
    } catch (err) {
      // Roll back deployments_count if enqueue fails
      await User.updateOne(
        { _id: user_id },
        { $inc: { deployments_count: -1 } }
      );
      throw err;
    }

    res.json({
      deployment_id: deployment._id,
      build_id: build._id,
      build_name: buildName,
      slug,
      status: BuildStatus.Queued,
    });
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

    const { deployment_id } = req.body as {
      deployment_id: string;
    };

    // Verify deployment exists and belongs to user
    const deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id,
    });

    if (!deployment) {
      return res
        .status(404)
        .json({ message: "Deployment not found or unauthorized" });
    }

    // Create new build row with short build_name
    const buildName = shortid.generate();
    const build = await Builds.create({
      deployment_id: deployment._id,
      build_name: buildName,
      status: BuildStatus.Queued,
    });

    try {
      console.log(
        `${deployment.installCommands} && ${deployment.buildCommands}`
      );
      // Queue job for worker with existing deployment details
      await enqueueBuild({
        buildId: build.build_name,
        deploymentId: deployment._id.toString(),
        userId: user_id.toString(),
        repo_url: deployment.repo_url,
        slug: deployment.slug,
        project_type: deployment.projectType,
        buildCommands: deployment.buildCommands,
        installCommands: deployment.installCommands,
        buildDir: deployment.buildDir,
      });

      res.json({
        deployment_id: deployment._id,
        build_id: build._id,
        build_name: buildName,
        slug: deployment.slug,
        status: BuildStatus.Queued,
      });
    } catch (err) {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
export const getDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  try {
    const deployments = await Deployments.find({ user_id }).select("_id slug img_url");
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
    const deployment = await Deployments.findOne({
      _id: deployment_id,
      user_id: user_id,

    });
    if (!deployment) {
      res.status(401).json({ meesage: "No deployments!" });
      return;
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
  console.log(deployment_id);
  try {
    const deployments = await Deployments.findByIdAndDelete({
      _id: deployment_id,
    });
    //  console.log(deployments)
    await Builds.deleteMany({
      deployment_id,
    });

    if(deployments?.img_id){
      await Delete(deployments?.img_id)
    }
    if (!deployments) {
      res.status(401).json({ meesage: "Such deployment doesnt exists!" });
      return;
    }
    res.status(200).json({ message: "Deployment deleted successfully!" });
    return;
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

    const builds = await Builds.find({ deployment_id });

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
    if (!Deployment) return res.status(404).json({ error: "Deployment not found" });

    const Build = await Builds.findById(Deployment.current_build_id);
    if (!Build) return res.status(404).json({ error: "Build not found" });

    const name = `${Deployment.slug}&${Build.build_name}`;
    // const url = `http://${Deployment.slug}.localhost:8080`;
    const url = `https://${Deployment.slug}.apps.shriii.xyz`;

    // ✅ IF image already exists AND build_id is the same as last image build, return early
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

    // 🧹 Clean up old image if any
    if (Deployment.img_id) {
      try {
        await Delete(Deployment.img_id);
      } catch (err) {
        console.warn("⚠️ Failed to delete old image:", err);
      }
    }

    // 📸 Generate and Upload new screenshot
    try {
      const data = await captureAndUploadScreenshot(url, name);
      await Deployments.updateOne(
        { _id: Deployment._id },
        {
          img_url: data.url,
          img_id: data.fileId,
          image_build_id: Build._id, // ✅ Store which build the image belongs to
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


