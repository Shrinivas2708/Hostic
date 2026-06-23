import * as React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-hairline bg-surface-card px-3.5 py-2 text-sm text-on-dark",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
