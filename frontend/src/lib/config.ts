/**
 * Central URL config — set values in frontend/.env (see .env.example).
 *
 * VITE_DEPLOY_URL_TEMPLATE uses `{slug}` as the deployment subdomain placeholder.
 * Local:  http://{slug}.localhost:8080
 * Prod:   https://{slug}.apps.shribuilds.in
 *
 * Socket.IO shares the API origin (no separate socket server).
 */

const deployUrlTemplate =
  import.meta.env.VITE_DEPLOY_URL_TEMPLATE ?? "http://{slug}.localhost:8080";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

/** Socket.IO client URL — same host as API, without /api path */
export function deriveSocketUrl(fromApiUrl: string): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, "");
  }

  try {
    const parsed = new URL(fromApiUrl);
    parsed.pathname = parsed.pathname.replace(/\/api\/?$/, "");
    parsed.search = "";
    parsed.hash = "";
    const base = parsed.toString().replace(/\/$/, "");
    return base || "http://localhost:5000";
  } catch {
    return "http://localhost:5000";
  }
}

export const config = {
  apiUrl,
  socketUrl: deriveSocketUrl(apiUrl),
  deployUrlTemplate,
} as const;

export function getDeploymentUrl(slug: string): string {
  return deployUrlTemplate.replace("{slug}", slug);
}

/** Host + port for display (e.g. my-app.localhost:8080) */
export function getDeploymentHost(slug: string): string {
  try {
    return new URL(getDeploymentUrl(slug)).host;
  } catch {
    return deployUrlTemplate
      .replace("{slug}", slug)
      .replace(/^https?:\/\//, "");
  }
}

/** Example URL for marketing copy (uses slug "my-app") */
export function getDeploymentExampleHost(): string {
  return getDeploymentHost("my-app");
}
