import express from "express";
import { deleteAccount, login,  signup, update } from "../controller/auth.controller";
import { verifyToken } from "../utils/tokens";
const authRouter = express.Router();
authRouter.post("/signup",signup);
authRouter.post("/login",login);
authRouter.delete("/delete",verifyToken,deleteAccount);
authRouter.patch("/update",verifyToken,update);


export default authRouter 