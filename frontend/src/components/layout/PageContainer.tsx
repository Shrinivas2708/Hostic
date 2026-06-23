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
        "mx-auto w-full px-5 md:px-8 py-10 md:py-section",
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
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mb-10">
      {badge && (
        <span className="mb-3 inline-block rounded-pill bg-brand px-3 py-1 text-caption-upper text-on-primary">
          {badge}
        </span>
      )}
      <h1 className="text-display-md text-on-dark">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-prose">{description}</p>}
    </div>
  );
}
