import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-6",
  md: "p-8",
  lg: "p-8",
};

export function Card({
  children,
  className,
  featured,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border",
        featured
          ? "border-brand bg-brand text-on-primary"
          : "border-hairline bg-surface-card text-on-dark",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CodeWindow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface-card p-6 font-mono text-sm overflow-x-auto",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
      </div>
      {children}
    </div>
  );
}
