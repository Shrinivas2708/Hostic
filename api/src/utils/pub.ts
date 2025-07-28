import { createClient } from "redis";

const pubClient = createClient({
  url: process.env.REDIS_URL,
});
pubClient.on("error", (err) => console.error("❌ Redis Pub Error:", err));
pubClient.on("end", () => console.log("Redis Pub connection ended, attempting reconnect..."));
pubClient.on("reconnecting", () => console.log("Redis Pub reconnecting..."));

(async () => {
  try {
    await pubClient.connect();
    console.log("✅ Connected to Redis (Publisher)");
  } catch (err) {
    console.error("❌ Failed to connect to Redis (Publisher):", err);
  }
})();

export async function publishLog(buildId: string, message: string) {
  try {
    await pubClient.publish(`logs:${buildId}`, JSON.stringify(message));
  } catch (err : any) {
    console.error(`Failed to publish to logs:${buildId}: ${err.message}`);
    throw err; // Allow caller to handle or retry
  }
}