import {
  Github,
  Settings2,
  Container,
  CloudUpload,
  Rocket,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

const steps: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Github,
    title: "Paste GitHub link",
    desc: "Connect your public repo with a single URL — no OAuth required.",
  },
  {
    icon: Settings2,
    title: "Configure build settings",
    desc: "Set install and build commands, pick your framework, optional subfolder.",
  },
  {
    icon: Container,
    title: "Spin up Docker",
    desc: "Your code builds inside an isolated Node 20 container.",
  },
  {
    icon: CloudUpload,
    title: "Upload to R2",
    desc: "Production artifacts are stored on Cloudflare R2 object storage.",
  },
  {
    icon: Rocket,
    title: "Deploy to the world",
    desc: "Your app goes live on a unique subdomain via the edge proxy.",
  },
  {
    icon: RefreshCw,
    title: "Redeploy with ease",
    desc: "Trigger a fresh build anytime — we clone, build, and publish again.",
  },
];

function StepCard({
  step,
  icon: Icon,
  title,
  desc,
  isLastInRow,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  isLastInRow?: boolean;
}) {
  return (
    <div className="relative flex h-full">
      {/* Connector line — desktop only, between cards in a row */}
      {!isLastInRow && (
        <div
          className="pointer-events-none absolute top-10 left-[calc(100%-12px)] z-0 hidden h-px w-6 bg-hairline-strong lg:block"
          aria-hidden
        />
      )}

      <article className="group relative flex h-full w-full flex-col rounded-lg border border-hairline bg-surface-card p-6 transition-colors hover:border-hairline-strong">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className="text-caption-upper text-brand">
            Step {String(step).padStart(2, "0")}
          </span>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-elevated">
            <Icon className="h-5 w-5 text-on-dark" strokeWidth={1.75} />
          </div>
        </div>

        <h3 className="text-base font-semibold leading-snug text-on-dark">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-copy">{desc}</p>
      </article>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-hairline bg-surface-soft py-16 md:py-section"
    >
      <div className="mx-auto max-w-content px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-caption-upper text-brand">Workflow</span>
          <h2 className="mt-3 text-display-md text-on-dark">
            How it <span className="text-brand">works</span>
          </h2>
          <p className="mt-4 text-prose">
            From GitHub link to live URL in minutes. Six simple steps.
          </p>
        </div>

        <ol className="mt-14 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {steps.map((step, index) => (
            <li key={step.title}>
              <StepCard
                step={index + 1}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
                isLastInRow={(index + 1) % 3 === 0}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
