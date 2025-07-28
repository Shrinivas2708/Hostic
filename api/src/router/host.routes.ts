import { Router } from "express"
import { verifyToken } from "../utils/tokens"
import { deploy, redeploy, getDeployments,deleteDeployment, getBuildsForDeployment, getDeployment } from "../controller/host.controller"
const hostRouter = Router()
hostRouter.use(verifyToken)
hostRouter.post("/",deploy)
hostRouter.post("/redeploy",redeploy)
hostRouter.get("/",getDeployments)
hostRouter.get("/deployment",getDeployment)
hostRouter.delete("/delete",deleteDeployment)
hostRouter.get("/builds",getBuildsForDeployment)
export default hostRouter