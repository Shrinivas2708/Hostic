import type { CorsOptions } from "cors";

export function getCorsOptions(): CorsOptions {
  const origins = new Set<string>([
    "http://localhost:5173",
    "http://localhost:4173",
  ]);

  const frontend = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");
  if (frontend) origins.add(frontend);

  if (process.env.CORS_ORIGIN) {
    for (const part of process.env.CORS_ORIGIN.split(",")) {
      const trimmed = part.trim().replace(/\/$/, "");
      if (trimmed) origins.add(trimmed);
    }
  }

  const list = [...origins];

  return {
    origin: (origin, callback) => {
      // Same-origin, curl, server-to-server
      if (!origin) {
        callback(null, true);
        return;
      }
      if (list.includes(origin)) {
        callback(null, true);
        return;
      }
      // Dev fallback when FRONTEND_URL not set yet
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}
