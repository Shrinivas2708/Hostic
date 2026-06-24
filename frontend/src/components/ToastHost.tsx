import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";
import { useToastStore, type ToastColor, type ToastItem } from "../store/toastStore";

const AUTO_DISMISS_MS = 5000;

const styles: Record<
  ToastColor,
  { border: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    border: "border-success/30 bg-success/10",
    icon: "text-success",
    Icon: CheckCircle2,
  },
  danger: {
    border: "border-error/30 bg-error/10",
    icon: "text-error",
    Icon: AlertCircle,
  },
  warning: {
    border: "border-warning/30 bg-warning/10",
    icon: "text-warning",
    Icon: AlertTriangle,
  },
  default: {
    border: "border-hairline bg-surface-card",
    icon: "text-brand",
    Icon: Info,
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const variant = styles[toast.color];
  const Icon = variant.Icon;

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div
      role="alert"
      className={clsx(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        variant.border
      )}
    >
      <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", variant.icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-dark">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm leading-relaxed text-copy">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface-elevated hover:text-on-dark"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
