import { createClient } from "redis";

export const subClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

subClient.on("error", (err) => console.error("❌ Redis Sub Error:", err));
subClient.on("end", () => console.log("Redis Sub connection ended, attempting reconnect..."));
subClient.on("reconnecting", () => console.log("Redis Sub reconnecting..."));

(async () => {
  try {
    await subClient.connect();
    console.log("✅ Connected to Redis (Subscriber)");
  } catch (err) {
    console.error("❌ Failed to connect to Redis (Subscriber):", err);
  }
})();

// Updated subscribeLogs with proper arguments
export function subscribeLogs(buildId: string, onMessage: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    subClient
      .subscribe(`logs:${buildId}`, (message, channel) => {
        // The order of arguments might vary by Redis client version; adjust if needed
        if (channel === `logs:${buildId}`) {
          try {
            onMessage(message);
          } catch (err:any) {
            console.error(`Error processing message on ${channel}: ${err.message}`);
          }
        }
      })
      .then(() => {
        console.log(`Subscribed to Redis channel: logs:${buildId}`);
        resolve();
      })
      .catch((err) => {
        console.error(`Failed to subscribe to logs:${buildId}: ${err.message}`);
        reject(err);
      });
  });
}