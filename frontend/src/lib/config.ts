/**
 * Central URL config — set values in frontend/.env (see .env.example).
 *
 * VITE_DEPLOY_URL_TEMPLATE uses `{slug}` as the deployment subdomain placeholder.
 * Local:  http://{slug}.localhost:8080
 * Prod:   https://{slug}.apps.shribuilds.in
 */

const deployUrlTemplate =
  import.meta.env.VITE_DEPLOY_URL_TEMPLATE ?? "http://{slug}.localhost:8080";

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? "ws://localhost:9001",
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
