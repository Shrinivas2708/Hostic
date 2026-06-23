import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Container,
  Globe,
  Lock,
  Minus,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface PricingTier {
  id: string;
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  featured?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    id: "free",
    title: "Free",
    price: "$0",
    description: "Perfect for side projects and learning.",
    features: [
      "3 deployments",
      "3 builds per project",
      "SSL on every subdomain",
      "Global CDN delivery",
      "Live build logs",
      "Docker-isolated builds",
    ],
  },
  {
    id: "basic",
    title: "Basic",
    price: "$10",
    period: "/mo",
    description: "For indie hackers shipping real products.",
    features: [
      "Everything in Free",
      "Custom domain support",
      "10 GB artifact storage",
      "Build history & rollbacks",
      "Email support",
      "Preview screenshots",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    price: "$20",
    period: "/mo",
    description: "For teams that need speed and visibility.",
    badge: "Most popular",
    featured: true,
    features: [
      "Everything in Basic",
      "Priority build queue",
      "Advanced analytics",
      "Team collaboration",
      "Priority support",
      "99.9% uptime SLA",
    ],
  },
];

const includedEverywhere = [
  { icon: Container, label: "Docker builds" },
  { icon: Globe, label: "Edge CDN" },
  { icon: Lock, label: "Free SSL" },
  { icon: Terminal, label: "Live logs" },
  { icon: Zap, label: "Instant redeploys" },
];

type PlanKey = "free" | "basic" | "pro";

const comparisonRows: {
  label: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
}[] = [
  { label: "Deployments", free: "3", basic: "3", pro: "3" },
  { label: "Builds per project", free: "3", basic: "3", pro: "3" },
  { label: "Docker-isolated builds", free: true, basic: true, pro: true },
  { label: "Live build logs", free: true, basic: true, pro: true },
  { label: "SSL certificates", free: true, basic: true, pro: true },
  { label: "Global CDN", free: true, basic: true, pro: true },
  { label: "Custom domains", free: false, basic: true, pro: true },
  { label: "Artifact storage", free: "1 GB", basic: "10 GB", pro: "50 GB" },
  { label: "Preview screenshots", free: false, basic: true, pro: true },
  { label: "Priority support", free: false, basic: false, pro: true },
  { label: "Advanced analytics", free: false, basic: false, pro: true },
];

const faqs = [
  {
    q: "What counts as a deployment?",
    a: "Each unique project you connect counts as one deployment. You can redeploy the same project up to 3 times before needing to remove it or upgrade.",
  },
  {
    q: "Which frameworks are supported?",
    a: "Any static site or SPA that builds with Node — React, Vite, Next.js static export, Vue, Astro, and more. You provide the install and build commands.",
  },
  {
    q: "Do I need a credit card for the Free plan?",
    a: "No. Sign up, paste a GitHub URL, and deploy. The Free plan is fully functional for personal projects.",
  },
  {
    q: "Where are my files stored?",
    a: "Build artifacts are uploaded to Cloudflare R2 and served through our edge proxy with SPA fallback routing.",
  },
  {
    q: "Can I use a custom domain?",
    a: "Custom domains are available on Basic and Pro plans. Free plan sites are served on a unique Hostic subdomain.",
  },
  {
    q: "What happens when I hit my build limit?",
    a: "You'll need to delete an existing deployment or upgrade your plan. Build limits reset per deployment, not per account.",
  },
];

function FeatureCheck({ featured }: { featured?: boolean }) {
  return (
    <Check
      className={cn("h-4 w-4 shrink-0", featured ? "text-on-primary" : "text-brand")}
      strokeWidth={2.5}
    />
  );
}

function PricingCard({
  tier,
  onSelect,
}: {
  tier: PricingTier;
  onSelect: () => void;
}) {
  const featured = tier.featured;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-lg border p-6 lg:p-8",
        featured
          ? "border-brand bg-brand text-on-primary"
          : "border-hairline bg-surface-card text-on-dark"
      )}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-6 rounded-pill bg-on-primary px-3 py-1 text-caption-upper text-brand">
          {tier.badge}
        </span>
      )}

      <div>
        <h3 className="text-xl font-bold">{tier.title}</h3>
        <p
          className={cn(
            "mt-2 text-sm",
            featured ? "text-on-primary/70" : "text-copy"
          )}
        >
          {tier.description}
        </p>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
        {tier.period && (
          <span
            className={cn(
              "text-sm",
              featured ? "text-on-primary/70" : "text-muted"
            )}
          >
            {tier.period}
          </span>
        )}
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <FeatureCheck featured={featured} />
            <span className={featured ? "text-on-primary/90" : "text-copy"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? "secondary" : "outline"}
        className={cn(
          "mt-8 w-full",
          featured && "bg-on-primary text-on-dark hover:bg-on-primary/90 border-0",
          !featured && "border-hairline-strong hover:border-brand hover:text-brand"
        )}
        onClick={onSelect}
      >
        Get started
      </Button>
    </article>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-brand" strokeWidth={2.5} />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-muted-soft" strokeWidth={2} />
    );
  }
  return <span className="text-sm text-on-dark">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-hairline last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-on-dark">{q}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-copy">{a}</p>
      )}
    </div>
  );
}

function Pricing() {
  const navigate = useNavigate();

  const goSignup = () => navigate("/signup");

  return (
    <section id="pricing" className="border-t border-hairline py-16 md:py-section">
      <div className="mx-auto max-w-content px-5 md:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-caption-upper text-brand">Pricing</span>
          <h2 className="mt-3 text-display-md text-on-dark">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-prose">
            Start free. Scale when you need custom domains, more storage, or
            priority support.
          </p>
        </div>

        {/* Included everywhere */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-lg border border-hairline bg-surface-soft px-6 py-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Included on all plans
          </span>
          {includedEverywhere.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-copy">
              <Icon className="h-4 w-4 text-brand" strokeWidth={1.75} />
              {label}
            </div>
          ))}
        </div>

        {/* Tier cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-6">
          {tiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} onSelect={goSignup} />
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-bold text-on-dark">
            Compare plans
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-copy">
            A full breakdown of what each tier includes.
          </p>

          <div className="mt-10 overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full min-w-[560px] border-collapse text-center">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted">
                    Feature
                  </th>
                  {(["free", "basic", "pro"] as PlanKey[]).map((plan) => (
                    <th
                      key={plan}
                      className={cn(
                        "px-4 py-4 text-sm font-semibold capitalize",
                        plan === "pro" ? "text-brand" : "text-on-dark"
                      )}
                    >
                      {plan}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={cn(
                      "border-b border-hairline last:border-0",
                      i % 2 === 0 ? "bg-surface-card" : "bg-canvas"
                    )}
                  >
                    <td className="px-6 py-4 text-left text-sm text-copy">
                      {row.label}
                    </td>
                    <td className="px-4 py-4">
                      <ComparisonCell value={row.free} />
                    </td>
                    <td className="px-4 py-4">
                      <ComparisonCell value={row.basic} />
                    </td>
                    <td className="px-4 py-4">
                      <ComparisonCell value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-caption-upper text-brand">FAQ</span>
            <h3 className="mt-3 text-2xl font-bold text-on-dark">
              Frequently asked questions
            </h3>
            <p className="mt-3 text-sm text-copy">
              Everything you need to know before your first deploy. Can&apos;t
              find an answer?{" "}
              <a href="/#contact" className="text-brand underline">
                Contact us
              </a>
              .
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface-card px-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        {/* Enterprise strip */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-lg border border-hairline bg-surface-soft p-8 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-lg font-semibold text-on-dark">
              Need something bigger?
            </h3>
            <p className="mt-1 text-sm text-copy">
              Custom limits, dedicated infrastructure, and SLA for teams at
              scale.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/#contact")}>
            Talk to us
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
