import {
  Box,
  RefreshCw,
  Settings2,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
}

const features: Feature[] = [
  {
    icon: Box,
    title: "Containerized & secure",
    description:
      "Every build runs in an isolated Docker container — your code never touches the host.",
  },
  {
    icon: Settings2,
    title: "Custom build commands",
    description:
      "Bring any framework: React, Vite, Astro, Vue, or plain static HTML.",
  },
  {
    icon: Zap,
    title: "Optimized for performance",
    description:
      "Artifacts served from the edge via R2 with SPA fallback and smart caching.",
    featured: true,
  },
  {
    icon: Sparkles,
    title: "One-click deploy",
    description:
      "Paste a GitHub URL, set install + build commands, and ship in minutes.",
  },
  {
    icon: RefreshCw,
    title: "Instant redeploys",
    description:
      "Trigger a fresh build from the dashboard — we clone, rebuild, and publish.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  featured,
}: Feature) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-lg border p-6 transition-colors lg:p-8",
        featured
          ? "border-brand bg-brand text-on-primary"
          : "border-hairline bg-surface-card text-on-dark hover:border-hairline-strong"
      )}
    >
      <div
        className={cn(
          "mb-6 flex h-11 w-11 items-center justify-center rounded-md border",
          featured
            ? "border-on-primary/20 bg-on-primary/10"
            : "border-hairline bg-surface-elevated"
        )}
      >
        <Icon
          className={cn("h-5 w-5", featured ? "text-on-primary" : "text-on-dark")}
          strokeWidth={1.75}
        />
      </div>

      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
      <p
        className={cn(
          "mt-2 flex-1 text-sm leading-relaxed",
          featured ? "text-on-primary/75" : "text-copy"
        )}
      >
        {description}
      </p>
    </article>
  );
}

export function Features() {
  const primary = features.slice(0, 3);
  const secondary = features.slice(3);

  return (
    <section id="features" className="py-16 md:py-section">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-caption-upper text-brand">Features</span>
          <h2 className="mt-3 text-display-md text-on-dark">
            Built for <span className="text-brand">modern</span> frontends
          </h2>
          <p className="mt-4 text-prose">
            Everything you need to ship static sites and SPAs at scale.
          </p>
        </div>

        {/* Top row — 3 cards */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {primary.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Bottom row — 2 cards centered */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:mx-auto lg:max-w-[calc(66.666%-12px)] lg:gap-6">
          {secondary.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
