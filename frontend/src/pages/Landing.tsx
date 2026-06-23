import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { CodeWindow } from "../components/ui/card";
import { Highlighter } from "../components/ui/highlighter";
import { HowItWorks } from "../components/HowItWorks";
import { Features } from "../components/Feature";
import Contact from "../components/Contact";
import Pricing from "../components/Pricing";

const stats = [
  { value: "3", label: "Free deployments" },
  { value: "<60s", label: "Avg build time" },
  { value: "100%", label: "Static & SPA" },
];

const Landing = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-content px-5 md:px-8 py-16 md:py-section">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="mb-4 inline-block rounded-pill bg-surface-card px-3 py-1 text-caption-upper text-muted">
              Frontend hosting platform
            </span>
            <h1 className="text-display-xl text-on-dark">
  Deploy your frontend{" "}
  <Highlighter>faster</Highlighter>{" "}
  than ever
</h1>
            <p className="mt-6 max-w-xl text-prose text-lg">
              Build, preview, and ship modern frontend apps with lightning speed.
              Connect a Git repo and let Hostic handle the rest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  navigate(token ? "/deployments" : "/signup")
                }
              >
                {token ? "Start deploying" : "Get started free"}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/#how-it-works")}>
                How it works
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-stat">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <CodeWindow>
              <pre className="text-prose leading-relaxed">
                <span className="text-muted"># Deploy in three commands</span>
                {"\n"}
                <span className="text-info">$</span> git clone repo-url
                {"\n"}
                <span className="text-info">$</span> npm ci && npm run build
                {"\n"}
                <span className="text-info">$</span> hostic deploy --slug my-app
                {"\n\n"}
                <span className="text-success">✓</span>{" "}
                <span className="text-copy-strong">
                  Published at my-app.apps.hostic.dev
                </span>
              </pre>
            </CodeWindow>
          </div>
        </div>
      </section>

      <HowItWorks />

      <Features />
      <Pricing />

      {/* CTA band */}
      <section className="mx-auto max-w-content px-5 md:px-8 py-16">
        <div className="rounded-lg bg-brand p-10 md:p-16 text-center">
          <h2 className="text-display-md text-on-primary">
            Ready to deploy?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-on-primary/80">
            Join Hostic and ship your next frontend project in under a minute.
          </p>
          <div className="mt-8">
            <Button
              variant="secondary"
              className="bg-on-primary text-on-dark hover:bg-on-primary/90"
              onClick={() => navigate(token ? "/deployments" : "/signup")}
            >
              {token ? "Go to deployments" : "Create free account"}
            </Button>
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
};

export default Landing;
