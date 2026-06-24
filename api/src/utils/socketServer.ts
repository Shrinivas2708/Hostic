import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { subscribeLogs, subscribeStatus, subClient } from "./socketSub";

const latestStatuses = new Map<string, string>();

export function attachBuildSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    const buildId = socket.handshake.query.buildId as string;

    if (!buildId) {
      socket.disconnect(true);
      return;
    }

    if (latestStatuses.has(buildId)) {
      socket.emit("status", latestStatuses.get(buildId));
    }

    subscribeLogs(buildId, (entry) => {
      if (socket.connected) socket.emit("log", entry);
    }).catch((err) => {
      console.error(`Subscription failed for logs:${buildId}:`, err);
      if (socket.connected) {
        socket.emit("error", `Failed to subscribe to build logs for ${buildId}`);
      }
    });

    subscribeStatus(buildId, (status) => {
      if (!socket.connected) return;
      latestStatuses.set(buildId, status);
      socket.emit("status", status);
    }).catch((err) => {
      console.error(`Subscription failed for status:${buildId}:`, err);
      if (socket.connected) {
        socket.emit(
          "error",
          `Failed to subscribe to build status for ${buildId}`
        );
      }
    });

    socket.on("disconnect", () => {
      subClient.pUnsubscribe(`logs:${buildId}`).catch((err) =>
        console.error(`Failed to unsubscribe from logs:${buildId}:`, err)
      );
      subClient.pUnsubscribe(`status:${buildId}`).catch((err) =>
        console.error(`Failed to unsubscribe from status:${buildId}:`, err)
      );
    });
  });

  return io;
}
