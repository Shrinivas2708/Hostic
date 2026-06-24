import { create } from "zustand";

export type ToastColor = "success" | "danger" | "warning" | "default";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  color: ToastColor;
};

type ToastStore = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random());
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export function addToast(opts: {
  title: string;
  description?: string;
  color?: ToastColor | "primary";
}): string | null {
  const color =
    opts.color === "danger"
      ? "danger"
      : opts.color === "warning"
        ? "warning"
        : opts.color === "success"
          ? "success"
          : "default";

  return useToastStore.getState().push({
    title: opts.title,
    description: opts.description,
    color,
  });
}
