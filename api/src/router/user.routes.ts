import  { Router } from "express"
import { verifyToken } from "../utils/tokens";
import { getUser } from "../controller/user.controller";
const userRouter = Router();
userRouter.use(verifyToken);
userRouter.get("/me",getUser)
export default userRouter