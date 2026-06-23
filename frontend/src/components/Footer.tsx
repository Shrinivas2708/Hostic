const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Deploy", href: "/deployments" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "GitHub", href: "https://github.com/Shrinivas2708" },
    { label: "Contact", href: "/#contact" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Twitter", href: "https://twitter.com/Shrinivas2708" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/shrinivas-sherikar-a77980231/" },
  ],
};

function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas py-16">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <div className="mb-12 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-on-primary">
            H
          </span>
          <span className="text-lg font-bold text-on-dark">Hostic</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-semibold text-on-dark">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-on-dark"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-sm font-semibold text-on-dark">Connect</h4>
            <div className="flex gap-4">
              {["github", "linkedin", "twitter", "gmail", "instagram"].map((name) => (
                <a
                  key={name}
                  href={
                    name === "github"
                      ? "https://github.com/Shrinivas2708"
                      : name === "linkedin"
                        ? "https://www.linkedin.com/in/shrinivas-sherikar-a77980231/"
                        : name === "twitter"
                          ? "https://twitter.com/Shrinivas2708"
                          : name === "gmail"
                            ? "mailto:ssherikar2005@gmail.com"
                            : "https://www.instagram.com/itzzz_shriii/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-50 transition-opacity hover:opacity-100"
                >
                  <img
                    src={`/icons/${name}.svg`}
                    alt={name}
                    className="h-5 w-5"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-hairline pt-8 text-sm text-muted">
          Made with care by Shri · © {new Date().getFullYear()} Hostic
        </p>
      </div>
    </footer>
  );
}

export default Footer;
