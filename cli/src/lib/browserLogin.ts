import { exec } from "child_process";
import { getDefaultApiUrl } from "./config";

export type CliAuthStart = {
  session_id: string;
  url: string;
  expires_in: number;
};

export type CliAuthPoll =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "complete"; token: string; username: string };

export async function startCliAuth(apiUrl: string): Promise<CliAuthStart> {
  const base = apiUrl.replace(/\/$/, "") || getDefaultApiUrl();
  const res = await fetch(`${base}/auth/cli/start`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? "CLI auth failed");
  }
  return data as CliAuthStart;
}

export async function pollCliAuth(
  apiUrl: string,
  sessionId: string
): Promise<CliAuthPoll> {
  const base = apiUrl.replace(/\/$/, "") || getDefaultApiUrl();
  const res = await fetch(
    `${base}/auth/cli/poll/${encodeURIComponent(sessionId)}`
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? "Poll failed");
  }
  return data as CliAuthPoll;
}

export function openBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.log(`Open this URL in your browser:\n${url}`);
    }
  });
}

export async function loginViaBrowser(
  apiUrl: string,
  options: { intervalMs?: number; onWaiting?: () => void } = {}
): Promise<{ token: string; username: string }> {
  const { session_id, url } = await startCliAuth(apiUrl);
  openBrowser(url);
  options.onWaiting?.();

  const intervalMs = options.intervalMs ?? 2000;
  const deadline = Date.now() + 600_000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const result = await pollCliAuth(apiUrl, session_id);

    if (result.status === "complete") {
      return { token: result.token, username: result.username };
    }
    if (result.status === "expired") {
      throw new Error("Login session expired. Run `hostic login` again.");
    }
  }

  throw new Error("Timed out waiting for browser login.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
