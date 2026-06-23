import React from "react";
import { cn } from "../../lib/utils";
import { Loader } from "./Loader";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-on-primary hover:bg-brand-active disabled:bg-brand-disabled disabled:text-muted",
  secondary:
    "bg-surface-card text-on-dark border border-hairline hover:bg-surface-elevated",
  ghost: "bg-transparent text-on-dark hover:bg-surface-card",
  danger:
    "bg-transparent text-error border border-error/40 hover:bg-error/10",
  outline:
    "bg-transparent text-on-dark border border-hairline-strong hover:border-brand hover:text-brand",
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader /> : children}
    </button>
  );
}
