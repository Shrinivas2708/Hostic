import { ansi, paint } from "./ansi";

export type BuildLogLevel =
  | "info"
  | "error"
  | "stdout"
  | "stderr"
  | "success";

export type BuildLogEntry = {
  level: BuildLogLevel;
  message: string;
  at: number;
};

const PHASE_INSTALL = /^\[INSTALL\]\s*/;
const PHASE_BUILD = /^\[BUILD\]\s*/;

const NOISE_PATTERNS = [
  /^npm notice$/i,
  /^Run `npm fund`/i,
  /^Run `npm audit`/i,
  /^\d+ packages are looking for funding/i,
  /^To address all issues/i,
  /^New major version of npm available/i,
  /^Changelog:/i,
  /^To update run:/i,
];

function isNoiseLine(message: string): boolean {
  const line = message.trim();
  return NOISE_PATTERNS.some((p) => p.test(line));
}

export class BuildLogStream {
  private lastLine = "";

  printHeader(buildName: string, slug: string): void {
    const rule = paint(ansi.gray, "─".repeat(52));
    console.log("");
    console.log(rule);
    console.log(
      `  ${paint(ansi.bold, "Build")}  ${paint(ansi.cyan, buildName)}`
    );
    console.log(
      `  ${paint(ansi.bold, "Slug")}  ${slug}`
    );
    console.log(rule);
    console.log("");
  }

  printStatus(status: string): void {
    const labels: Record<string, string> = {
      queued: paint(ansi.yellow, "◐ Queued"),
      building: paint(ansi.cyan, "◉ Building"),
      success: paint(ansi.green, "● Success"),
      failed: paint(ansi.red, "✗ Failed"),
    };
    const label = labels[status] ?? status;
    console.log(`  ${label}`);
    if (status === "building" || status === "queued") {
      console.log("");
    }
  }

  printEntry(entry: BuildLogEntry): void {
    const raw = entry.message.replace(/\r\n/g, "\n");
    const lines = raw.split("\n");

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed.trim()) continue;

      const formatted = this.formatLine(trimmed, entry.level, entry.at);
      if (!formatted) continue;

      if (formatted === this.lastLine) continue;
      this.lastLine = formatted;
      console.log(formatted);
    }
  }

  printFooter(
    status: "success" | "failed",
    siteUrl: string,
    durationMs?: number
  ): void {
    console.log("");
    const rule = paint(ansi.gray, "─".repeat(52));
    console.log(rule);

    if (status === "success") {
      const host = siteUrl.replace(/^https?:\/\//, "");
      console.log(
        `  ${paint(ansi.green, "✓")} ${paint(ansi.bold, "Live")}  ${paint(ansi.cyan, host)}`
      );
      console.log(`  ${paint(ansi.gray, siteUrl)}`);
    } else {
      console.log(
        `  ${paint(ansi.red, "✗")} ${paint(ansi.bold, "Build failed")}`
      );
    }

    if (durationMs != null && durationMs > 0) {
      const secs = (durationMs / 1000).toFixed(1);
      console.log(`  ${paint(ansi.dim, `Finished in ${secs}s`)}`);
    }

    console.log(rule);
    console.log("");
  }

  private formatLine(
    message: string,
    level: BuildLogLevel,
    _at: number
  ): string | null {
    const text = message.trim();
    if (!text) return null;

    if (PHASE_INSTALL.test(text)) {
      const detail = text.replace(PHASE_INSTALL, "").trim();
      return this.phaseLine("install", detail || "installing dependencies");
    }

    if (PHASE_BUILD.test(text)) {
      const detail = text.replace(PHASE_BUILD, "").trim();
      return this.phaseLine("build", detail || "running build");
    }

    if (level === "success") {
      return `  ${paint(ansi.green, "✓")} ${text}`;
    }

    if (level === "error" || /build failed|docker exit/i.test(text)) {
      return `  ${paint(ansi.red, "✗")} ${paint(ansi.red, text)}`;
    }

    if (isNoiseLine(text)) {
      return null;
    }

    if (level === "stderr") {
      const isError = /error|ERR!|failed/i.test(text);
      const body = isError ? paint(ansi.yellow, text) : paint(ansi.gray, text);
      return `  ${paint(ansi.gray, "│")} ${body}`;
    }

    if (level === "stdout") {
      return `  ${paint(ansi.gray, "│")} ${text}`;
    }

    if (
      level === "info" &&
      /^(Starting build|Repository:|Branch:|Cloning|Repository cloned|Workspace ready|Using project directory|Detected project root|Preparing build|Cleaning up|Build job finished)/i.test(
        text
      )
    ) {
      return `  ${paint(ansi.gray, "·")} ${paint(ansi.dim, text)}`;
    }

    return `  ${paint(ansi.gray, "│")} ${text}`;
  }

  private phaseLine(phase: "install" | "build", detail: string): string {
    const label = phase === "install" ? "INSTALL" : "BUILD  ";
    const colored = paint(ansi.magenta, label);
    return `\n  ${colored}  ${paint(ansi.dim, detail)}`;
  }
}
