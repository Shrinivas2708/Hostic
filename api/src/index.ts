require("dotenv").config();
import connectToDB from "./config/db";
import express from "express";
import cors from "cors"
import { User } from "./model/User.model";
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
    const response = await User.create({
        username:"testuser",
        email:"ssherikar2005@gmail.com",
        password:"password123",

    })
    console.log("User created:", response);
    await User.deleteOne({
        id: response._id
    })
    console.log("User deleted:", response._id);
    res.json({
        message:"Welcome to Host It APIs!"
    })
})
