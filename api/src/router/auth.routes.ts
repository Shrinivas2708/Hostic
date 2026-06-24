import express from "express";
import { deleteAccount, login,  signup, update } from "../controller/auth.controller";
import {
  authorizeCli,
  pollCliAuth,
  startCliAuth,
} from "../controller/cliAuth.controller";
import { verifyToken } from "../utils/tokens";
const authRouter = express.Router();
authRouter.post("/signup",signup);
authRouter.post("/login",login);
authRouter.post("/cli/start", startCliAuth);
authRouter.get("/cli/poll/:session_id", pollCliAuth);
authRouter.post("/cli/authorize", verifyToken, authorizeCli);
authRouter.delete("/delete",verifyToken,deleteAccount);
authRouter.patch("/update",verifyToken,update);


export default authRouter 