import { createClient } from "redis";
export const subClient = createClient({
  url: process.env.REDIS_URL ,
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
export async function subscribeLogs(buildId: string, onMessage: (msg: string) => void) {
  const pattern = `logs:${buildId}`;
  await subClient.pSubscribe(pattern, (message, channel) => {
    if (channel === pattern) {
      try {
        onMessage(message);
      } catch (err: any) {
        console.error(`❌ Error processing log message: ${err.message}`);
      }
    }
  });
  console.log(`✅ Subscribed to ${pattern}`);
}

export async function subscribeStatus(buildId: string, onMessage: (msg: string) => void) {
  const pattern = `status:${buildId}`;
  await subClient.pSubscribe(pattern, (message, channel) => {
    if (channel === pattern) {
      try {
        onMessage(message);
      } catch (err: any) {
        console.error(`❌ Error processing status message: ${err.message}`);
      }
    }
  });
  console.log(`✅ Subscribed to ${pattern}`);
}
