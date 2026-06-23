import { cn } from "../../lib/utils";

interface HighlighterProps {
  children: React.ReactNode;
  className?: string;
}

export function Highlighter({
  children,
  className,
}: HighlighterProps) {
  return (
    <span
      className={cn(
        "relative inline-flex w-fit whitespace-nowrap",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -inset-y-1.5 -z-10"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#faff69"
            d="M3 55 C 2 25, 8 6, 30 4 C 55 2, 80 3, 96 8
               C 99 25, 98 55, 95 80
               C 97 92, 70 98, 40 96
               C 15 95, 1 90, 3 70 Z"
          />
        </svg>
      </span>

      <span className="relative z-10 px-[0.15em] text-black">
        {children}
      </span>
    </span>
  );
}