import { createClient } from "redis";
import { Server } from "socket.io";
require("dotenv").config();
import { subscribeLogs, subClient, subscribeStatus } from "./utils/sub";

// Store latest status for each buildId
const latestStatuses = new Map();

const io = new Server(9001, {
  cors: {
    origin: "*", // Restrict in production
  },
});

io.on("connection", (socket) => {
  const buildId = socket.handshake.query.buildId as string;

  if (!buildId) {
    console.log("Socket.IO connection rejected: Missing buildId");
    socket.disconnect(true);
    return;
  }

  console.log(`Client connected for buildId: ${buildId}`);

  // Send latest status to new client
  if (latestStatuses.has(buildId)) {
    socket.emit("status", latestStatuses.get(buildId));
    console.log(`Sent initial status ${latestStatuses.get(buildId)} to client for buildId: ${buildId}`);
  }

  subscribeLogs(buildId, (msg) => {
    if (socket.connected) {
      console.log(`Sending log to client for buildId: ${buildId}: ${msg}`);
      socket.emit("log", msg);
    }
  }).catch((err) => {
    console.error(`Subscription failed for logs:${buildId}: ${err.message}`);
    if (socket.connected) {
      socket.emit("error", `Failed to subscribe to build logs for ${buildId}`);
    }
  });

  subscribeStatus(buildId, (status) => {
    if (socket.connected) {
      console.log(`Status update: ${status}`);
      latestStatuses.set(buildId, status); // Update latest status
      socket.emit("status", status);
    }
  }).catch((err) => {
    console.error(`Subscription failed for status:${buildId}: ${err.message}`);
    if (socket.connected) {
      socket.emit("error", `Failed to subscribe to build status for ${buildId}`);
    }
  });

  socket.emit("message", `Connected to build logs for ${buildId}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected for buildId: ${buildId}`);
    subClient.pUnsubscribe(`logs:${buildId}`).catch((err) =>
      console.error(`Failed to unsubscribe from logs:${buildId}:`, err)
    );
    subClient.pUnsubscribe(`status:${buildId}`).catch((err) =>
      console.error(`Failed to unsubscribe from status:${buildId}:`, err)
    );
  });

  socket.on("error", (err) => {
    console.error(`Socket.IO error for buildId: ${buildId}:`, err);
  });
});

console.log("Socket.IO server running on http://localhost:9001");