import { Router } from "express";
import { verifyToken } from "../utils/tokens";
import {
  disconnectGitHub,
  detectProjectSettings,
  getConnectUrl,
  getGitHubStatus,
  getRepoDetails,
  githubCallback,
  listRepos,
} from "../controller/github.controller";

const githubRouter = Router();

githubRouter.get("/callback", githubCallback);
githubRouter.get("/status", verifyToken, getGitHubStatus);
githubRouter.get("/connect", verifyToken, getConnectUrl);
githubRouter.delete("/disconnect", verifyToken, disconnectGitHub);
githubRouter.get("/repos", verifyToken, listRepos);
githubRouter.get("/repos/:owner/:repo/detect", verifyToken, detectProjectSettings);
githubRouter.get("/repos/:owner/:repo", verifyToken, getRepoDetails);

export default githubRouter;
