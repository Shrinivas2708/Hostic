import { cn } from "../lib/utils";
import {
  type BuildLogEntry,
  formatLogTime,
  logLevelLabels,
  logLevelStyles,
} from "../lib/buildLogs";

type Props = {
  logs: BuildLogEntry[];
  emptyMessage?: string;
  className?: string;
};

export function BuildLogViewer({ logs, emptyMessage, className }: Props) {
  if (logs.length === 0) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        {emptyMessage ?? "No logs yet."}
      </p>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {logs.map((entry, i) => (
        <div
          key={`${entry.at}-${i}`}
          className="group flex gap-3 rounded px-1 py-0.5 hover:bg-surface-elevated/50"
        >
          <span className="w-[4.5rem] shrink-0 font-mono text-[11px] tabular-nums text-muted/70">
            {formatLogTime(entry.at)}
          </span>
          <span
            className={cn(
              "w-9 shrink-0 font-mono text-[10px] font-semibold tracking-wide",
              logLevelStyles[entry.level]
            )}
          >
            {logLevelLabels[entry.level]}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed",
              logLevelStyles[entry.level]
            )}
          >
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
