import { NextFunction, Request, Response } from "express";
import { User } from "../model/User.model";
import { Deployments } from "../model/Deployments.model";

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.id;
  try {
    const actualCount = await Deployments.countDocuments({ user_id });
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: { deployments_count: actualCount } },
      { new: true }
    ).select("+githubAccessToken -password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { githubAccessToken, password, ...safeUser } = user.toObject();

    res.status(200).json({
      user: {
        ...safeUser,
        githubConnected: Boolean(githubAccessToken),
      },
    });
  } catch (error) {
    next(error);
  }
};
