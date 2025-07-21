import { NextFunction, Request, Response } from "express";
import { generateSlug } from "random-word-slugs";
import { Deployments, ProjectType } from "../model/Deployments.model";
import { Builds, BuildStatus } from "../model/Builds.model";
import { User } from "../model/User.model";
import { enqueueBuild } from "../utils/buildQueue";
import shortid from "shortid";

export const deploy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user_id = req.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { repo_url, project_type, buildCommands } = req.body as {
      repo_url: string;
      project_type: ProjectType;
      buildCommands?: string;
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
    });

    // Create build row with short build_name
    const buildName = shortid.generate();
    const build = await Builds.create({
      deployment_id: deployment._id,
      build_name: buildName,
      status: BuildStatus.Queued,
    });

    try {
      // Queue job for worker
      enqueueBuild({
        buildId: build.build_name,
        deploymentId: deployment._id.toString(),
        userId: user_id.toString(),
        repo_url,
        slug,
        project_type,
        buildCommands,
      });
    } catch (err) {
      // Roll back deployments_count if enqueue fails
      await User.updateOne({ _id: user_id }, { $inc: { deployments_count: -1 } });
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