import { NextFunction, Request, Response } from "express";
import { User } from "../model/User.model";
import { createToken } from "../utils/tokens";
import {
  completeCliAuthSession,
  createCliAuthSession,
  createCliSessionId,
  getCliAuthUrl,
  pollCliAuthSession,
} from "../utils/cliAuth";
import { redisReady } from "../utils/pub";

export const startCliAuth = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await redisReady;
    const session_id = createCliSessionId();
    await createCliAuthSession(session_id);

    res.status(200).json({
      session_id,
      url: getCliAuthUrl(session_id),
      expires_in: 600,
    });
  } catch (error) {
    next(error);
  }
};

export const pollCliAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const result = await pollCliAuthSession(session_id);
    if (result === "expired") {
      return res.status(200).json({ status: "expired" });
    }

    if (result.status === "complete") {
      return res.status(200).json({
        status: "complete",
        token: result.token,
        username: result.username,
      });
    }

    res.status(200).json({ status: "pending" });
  } catch (error) {
    next(error);
  }
};

export const authorizeCli = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    const { session_id } = req.body as { session_id?: string };

    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = createToken(user._id.toString());
    const ok = await completeCliAuthSession(session_id, {
      token,
      username: user.username,
    });

    if (!ok) {
      return res.status(410).json({
        message: "CLI session expired. Run `hostic login` again in your terminal.",
      });
    }

    res.status(200).json({
      message: "CLI authorized",
      username: user.username,
    });
  } catch (error) {
    next(error);
  }
};
