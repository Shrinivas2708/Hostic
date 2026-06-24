import { cn } from "../../lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 md:px-8 py-6 md:py-8",
        narrow ? "max-w-lg" : "max-w-content",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  badge,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {badge && (
        <span className="mb-2 inline-block rounded-pill bg-brand px-2.5 py-0.5 text-caption-upper text-on-primary">
          {badge}
        </span>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-on-dark md:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 max-w-2xl text-sm text-copy">{description}</p>
      )}
    </div>
  );
}
