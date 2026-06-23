import { cn } from "../lib/utils";

const statusStyles: Record<string, string> = {
  queued: "border-warning/40 text-warning bg-warning/10",
  building: "border-info/40 text-info bg-info/10",
  failed: "border-error/40 text-error bg-error/10",
  success: "border-success/40 text-success bg-success/10",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "border-hairline text-muted"
      )}
    >
      {status}
    </span>
  );
}
