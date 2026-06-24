import { createClient } from "redis";

export const subClient = createClient({
  url: process.env.REDIS_URL,
});

subClient.on("error", (err) => console.error("Redis Sub Error:", err));

let subReady: Promise<void>;

(async () => {
  try {
    await subClient.connect();
    console.log("Connected to Redis (Subscriber)");
    subReady = Promise.resolve();
  } catch (err) {
    console.error("Failed to connect to Redis (Subscriber):", err);
    subReady = Promise.reject(err);
  }
})();

export { subReady };

export async function subscribeLogs(
  buildId: string,
  onMessage: (entry: { level?: string; message: string; at?: number }) => void
) {
  await subReady;
  const pattern = `logs:${buildId}`;
  await subClient.pSubscribe(pattern, (message, channel) => {
    if (channel !== pattern) return;
    try {
      const entry = JSON.parse(message) as {
        level?: string;
        message?: string;
        at?: number;
      };
      if (entry?.message) {
        onMessage({
          level: entry.level,
          message: entry.message,
          at: entry.at,
        });
        return;
      }
    } catch {
      /* legacy string payload */
    }
    onMessage({
      level: "info",
      message: message.replace(/^"|"$/g, ""),
      at: Date.now(),
    });
  });
}

export async function subscribeStatus(
  buildId: string,
  onMessage: (msg: string) => void
) {
  await subReady;
  const pattern = `status:${buildId}`;
  await subClient.pSubscribe(pattern, (message, channel) => {
    if (channel !== pattern) return;
    onMessage(message);
  });
}
