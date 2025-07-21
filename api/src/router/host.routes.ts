import { Router } from "express"
import { verifyToken } from "../utils/tokens"
import { deploy } from "../controller/host.controller"
const hostRouter = Router()
hostRouter.use(verifyToken)
hostRouter.post("/",deploy)
// hostRouter.get("/",)
export default hostRouter