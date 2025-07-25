require("dotenv").config();
import connectToDB from "./config/db";
import express from "express";
import cors from "cors"
import { User } from "./model/User.model";
import authRouter from "./router/auth.routes";
import { errorHandler } from "./utils/errorHandler";
import hostRouter from "./router/host.routes";
import userRouter from "./router/user.routes";
const app = express();
const PORT = process.env.PORT || 5000;
(async () => {
  await connectToDB();

  // Start your server after DB is connected
  app.listen(5000, () => console.log("Server running on port 5000"));
})();
app.use(cors({
    origin: "*"
}))

app.use(express.json())
app.get("/",async (req,res)=>{
    res.json({
        message:"Welcome to Host It APIs!"
    })
})
app.use("/api/auth",authRouter)
app.use("/api/host",hostRouter)
app.use("/api/user",userRouter)
app.use(errorHandler);