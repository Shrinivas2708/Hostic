import { Router } from "express"
import { verifyToken } from "../utils/tokens"
import { deploy, redeploy, getDeployments,deleteDeployment, getBuildsForDeployment, getDeployment, getBuild } from "../controller/host.controller"
const hostRouter = Router()
hostRouter.use(verifyToken)
hostRouter.post("/",deploy)
hostRouter.post("/redeploy",redeploy)
hostRouter.get("/",getDeployments)
hostRouter.get("/deployment",getDeployment)
hostRouter.delete("/delete",deleteDeployment)
hostRouter.get("/builds",getBuildsForDeployment)
hostRouter.get("/build",getBuild)
export default hostRouter