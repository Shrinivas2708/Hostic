import { Builds } from "../model/Builds.model";
import type { LogEntry } from "./pub";

const buffers = new Map<string, LogEntry[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 400;

async function flushBuild(buildName: string): Promise<void> {
  const batch = buffers.get(buildName);
  if (!batch?.length) return;

  buffers.set(buildName, []);
  await Builds.updateOne(
    { build_name: buildName },
    { $push: { logs: { $each: batch } } }
  );
}

async function flushAll(): Promise<void> {
  const names = [...buffers.keys()];
  await Promise.all(names.map((name) => flushBuild(name)));
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushAll().catch((err) => {
      console.error("Failed to persist build logs:", err);
    });
  }, FLUSH_MS);
}

export function queuePersistLog(buildName: string, entry: LogEntry): void {
  const batch = buffers.get(buildName) ?? [];
  batch.push(entry);
  buffers.set(buildName, batch);
  scheduleFlush();
}

export async function flushBuildLogs(buildName: string): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushBuild(buildName);
}

export async function flushAllBuildLogs(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushAll();
}
