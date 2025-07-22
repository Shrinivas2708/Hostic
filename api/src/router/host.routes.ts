import { Router } from "express"
import { verifyToken } from "../utils/tokens"
import { deploy, redeploy, getDeployments,deleteDeployment } from "../controller/host.controller"
const hostRouter = Router()
hostRouter.use(verifyToken)
hostRouter.post("/",deploy)
hostRouter.post("/redeploy",redeploy)
hostRouter.get("/",getDeployments)
hostRouter.delete("/delete",deleteDeployment)
export default hostRouter