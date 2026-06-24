require("dotenv").config();
import http from "http";
import connectToDB from "./config/db";
import express from "express";
import cors from "cors";
import authRouter from "./router/auth.routes";
import { errorHandler } from "./utils/errorHandler";
import hostRouter from "./router/host.routes";
import userRouter from "./router/user.routes";
import githubRouter from "./router/github.routes";
import { handleGitHubWebhook } from "./controller/webhook.controller";
import { attachBuildSocketServer } from "./utils/socketServer";
import { getCorsOptions } from "./utils/cors";

const app = express();
const PORT = process.env.PORT || 5000;

// GitHub webhooks require the raw body for signature verification
app.post(
  "/api/webhooks/github/:webhookSecret",
  express.raw({ type: "application/json" }),
  handleGitHubWebhook
);

app.use(cors(getCorsOptions()));
app.use(express.json());

app.get("/", async (req, res) => {
  res.json({
    message: "Welcome to Host It APIs!",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/host", hostRouter);
app.use("/api/user", userRouter);
app.use("/api/github", githubRouter);

app.use(errorHandler);

const server = http.createServer(app);
attachBuildSocketServer(server);

(async () => {
  await connectToDB();
  server.listen(PORT, () => {
    console.log(`API + realtime server running on port ${PORT}`);
  });
})();
