/**
 * Domain that hosts user deployments.
 *
 * Local:   APPS_DOMAIN=localhost     →  http://{slug}.localhost:8080
 * Prod:    APPS_DOMAIN=apps.shribuilds.in  →  https://{slug}.apps.shribuilds.in
 * Ngrok:   APPS_DOMAIN=path         →  https://<proxy-ngrok>/d/{slug}
 */
export function getAppsDomain(): string {
  return (process.env.APPS_DOMAIN || "localhost").trim().toLowerCase();
}

export function usesPathRouting(): boolean {
  return getAppsDomain() === "path";
}

/** Extract deployment slug from the incoming Host header. */
export function extractSlugFromHost(hostname: string): string | null {
  const host = hostname.split(":")[0].trim().toLowerCase();
  if (!host) return null;

  const appsDomain = getAppsDomain();
  if (appsDomain === "path") return null;

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

/** Path routing for ngrok (no wildcard subdomains): /d/{slug}/... */
export function extractSlugFromPath(
  reqPath: string
): { slug: string; assetPath: string } | null {
  const match = reqPath.match(/^\/d\/([a-z0-9-]+)(\/.*)?$/i);
  if (!match) return null;

  const slug = match[1];
  if (!isValidSlug(slug)) return null;

  const assetPath = match[2] || "/";
  return { slug, assetPath };
}

export function resolveRequestTarget(
  hostname: string,
  reqPath: string
): { slug: string; assetPath: string } | null {
  if (usesPathRouting()) {
    const fromPath = extractSlugFromPath(reqPath);
    if (fromPath) return fromPath;
  }

  const slug = extractSlugFromHost(hostname);
  if (!slug) return null;

  return { slug, assetPath: reqPath };
}

function isValidSlug(slug: string): boolean {
  return Boolean(slug) && !slug.includes(".") && /^[a-z0-9-]+$/i.test(slug);
}

export function resolveRequestedFile(reqPath: string): string {
  if (reqPath === "/" || reqPath === "") return "/index.html";
  if (!reqPath.includes(".")) return "/index.html";
  return reqPath;
}
