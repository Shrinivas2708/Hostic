require('dotenv').config()
import { Server } from "socket.io";
import { subscribeLogs, subClient, subscribeStatus } from "./utils/sub";

const io = new Server(9001, {
  cors: {
    origin: "*", // Adjust for production (e.g., specific origins)
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

  subscribeLogs(buildId, (msg) => {
    if (socket.connected) {
      console.log(`Sending log to client for buildId: ${buildId}: ${msg}`);
      socket.emit("log", msg); 
      socket.emit("complete")
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
    socket.emit("status", status);
  }
});
  socket.emit("message", `Connected to build logs for ${buildId}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected for buildId: ${buildId}`);
    subClient.unsubscribe(`logs:${buildId}`).catch((err) => {
      console.error(`Failed to unsubscribe from logs:${buildId}:`, err);
    });
  });

  socket.on("error", (err) => {
    console.error(`Socket.IO error for buildId: ${buildId}:`, err);
  });
});

console.log("Socket.IO server running on http://localhost:9001");