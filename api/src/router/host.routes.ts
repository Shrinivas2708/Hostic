import { Router } from "express"
import { verifyToken } from "../utils/tokens"
import { deploy, redeploy, getDeployments } from "../controller/host.controller"
const hostRouter = Router()
hostRouter.use(verifyToken)
hostRouter.post("/",deploy)
hostRouter.post("/redeploy",redeploy)
hostRouter.get("/",getDeployments)
export default hostRouter