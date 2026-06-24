/**
 * Domain that hosts user deployments.
 *
 * Local:   APPS_DOMAIN=localhost        →  http://{slug}.localhost:8080
 * Prod:    APPS_DOMAIN=apps.shribuilds.in  →  https://{slug}.apps.shribuilds.in
 *
 * DNS: wildcard `*.apps.yourdomain.com` → proxy server (see ARCHITECTURE.md).
 */
export function getAppsDomain(): string {
  return (process.env.APPS_DOMAIN || "localhost").trim().toLowerCase();
}

/** Extract deployment slug from the incoming Host header. */
export function extractSlugFromHost(hostname: string): string | null {
  const host = hostname.split(":")[0].trim().toLowerCase();
  if (!host) return null;

  const appsDomain = getAppsDomain();

  if (appsDomain === "localhost") {
    if (!host.endsWith(".localhost")) return null;
    const slug = host.slice(0, -".localhost".length);
    return isValidSlug(slug) ? slug : null;
  }

  const suffix = `.${appsDomain}`;
  if (!host.endsWith(suffix)) return null;

  const slug = host.slice(0, -suffix.length);
  return isValidSlug(slug) ? slug : null;
}

function isValidSlug(slug: string): boolean {
  return Boolean(slug) && !slug.includes(".") && /^[a-z0-9-]+$/i.test(slug);
}
