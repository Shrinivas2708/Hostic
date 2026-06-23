import { NextFunction, Request, Response } from "express";
import { User } from "../model/User.model";
import {
  createGitHubOAuthState,
  exchangeGitHubCode,
  fetchGitHubUser,
  getFrontendUrl,
  getGitHubOAuthUrl,
  getRepo,
  listRepoBranches,
  listUserRepos,
  verifyGitHubOAuthState,
} from "../utils/github";
import { removeGitHubWebhookForDeployment } from "../utils/githubWebhooks";
import { Deployments } from "../model/Deployments.model";

export const getGitHubStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.id).select(
      "+githubAccessToken githubUsername githubId"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      connected: Boolean(user.githubAccessToken),
      username: user.githubUsername || null,
      github_id: user.githubId || null,
    });
  } catch (err) {
    next(err);
  }
};

export const getConnectUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const state = createGitHubOAuthState(user_id);
    const url = getGitHubOAuthUrl(state);

    res.json({ url });
  } catch (err) {
    next(err);
  }
};

export const githubCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    const frontend = getFrontendUrl();

    if (error) {
      return res.redirect(
        `${frontend}/deployments?github=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${frontend}/deployments?github=error&message=${encodeURIComponent("Missing OAuth code")}`
      );
    }

    const decoded = verifyGitHubOAuthState(state);
    if (!decoded) {
      return res.redirect(
        `${frontend}/deployments?github=error&message=${encodeURIComponent("Invalid or expired OAuth state")}`
      );
    }

    const tokenData = await exchangeGitHubCode(code);
    const ghUser = await fetchGitHubUser(tokenData.access_token);

    await User.findByIdAndUpdate(decoded.userId, {
      githubId: String(ghUser.id),
      githubUsername: ghUser.login,
      githubAccessToken: tokenData.access_token,
    });

    res.redirect(`${frontend}/deployments?github=connected`);
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    const message =
      err instanceof Error ? err.message : "GitHub connection failed";
    res.redirect(
      `${getFrontendUrl()}/deployments?github=error&message=${encodeURIComponent(message)}`
    );
  }
};

export const disconnectGitHub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deployments = await Deployments.find({ user_id });
    for (const deployment of deployments) {
      await removeGitHubWebhookForDeployment(deployment, user_id);
      await Deployments.updateOne(
        { _id: deployment._id },
        {
          $unset: { githubWebhookId: 1 },
          $set: { githubWebhookManaged: false },
        }
      );
    }

    await User.findByIdAndUpdate(user_id, {
      $unset: {
        githubId: 1,
        githubUsername: 1,
        githubAccessToken: 1,
      },
    });

    res.json({ message: "GitHub disconnected" });
  } catch (err) {
    next(err);
  }
};

export const listRepos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.id).select("+githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: "GitHub is not connected" });
    }

    const repos = await listUserRepos(user.githubAccessToken);

    res.json({
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        html_url: r.html_url,
        default_branch: r.default_branch,
        description: r.description,
        updated_at: r.updated_at,
        owner: r.owner.login,
        owner_avatar: r.owner.avatar_url,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getRepoDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.id).select("+githubAccessToken");
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: "GitHub is not connected" });
    }

    const { owner, repo } = req.params;
    const repoData = await getRepo(user.githubAccessToken, owner, repo);
    const branches = await listRepoBranches(
      user.githubAccessToken,
      owner,
      repo
    );

    res.json({
      repo: {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        private: repoData.private,
        html_url: repoData.html_url,
        default_branch: repoData.default_branch,
        description: repoData.description,
        owner: repoData.owner.login,
      },
      branches,
    });
  } catch (err) {
    next(err);
  }
};
