import crypto from "crypto";
import { pubClient } from "./pub";

const CLI_AUTH_PREFIX = "cli-auth:";
const CLI_AUTH_TTL_SEC = 600;

export type CliAuthSession = {
  status: "pending" | "complete";
  token?: string;
  username?: string;
};

function sessionKey(sessionId: string): string {
  return `${CLI_AUTH_PREFIX}${sessionId}`;
}

export function createCliSessionId(): string {
  return crypto.randomUUID();
}

export async function createCliAuthSession(
  sessionId: string
): Promise<void> {
  const payload: CliAuthSession = { status: "pending" };
  await pubClient.setEx(
    sessionKey(sessionId),
    CLI_AUTH_TTL_SEC,
    JSON.stringify(payload)
  );
}

export async function completeCliAuthSession(
  sessionId: string,
  data: { token: string; username: string }
): Promise<boolean> {
  const key = sessionKey(sessionId);
  const raw = await pubClient.get(key);
  if (!raw) return false;

  const current = JSON.parse(raw) as CliAuthSession;
  if (current.status === "complete") return true;

  const payload: CliAuthSession = {
    status: "complete",
    token: data.token,
    username: data.username,
  };
  await pubClient.setEx(key, CLI_AUTH_TTL_SEC, JSON.stringify(payload));
  return true;
}

export async function pollCliAuthSession(
  sessionId: string
): Promise<CliAuthSession | "expired"> {
  const raw = await pubClient.get(sessionKey(sessionId));
  if (!raw) return "expired";

  const data = JSON.parse(raw) as CliAuthSession;
  if (data.status === "complete" && data.token) {
    await pubClient.del(sessionKey(sessionId));
    return data;
  }
  return { status: "pending" };
}

export function getCliAuthUrl(sessionId: string): string {
  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
  return `${frontend}/cli-auth?session=${encodeURIComponent(sessionId)}`;
}
