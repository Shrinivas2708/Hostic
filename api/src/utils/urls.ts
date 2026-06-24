export function getDeploymentUrl(slug: string): string {
  const template =
    process.env.DEPLOY_URL_TEMPLATE ?? "http://{slug}.localhost:8080";
  return template.replace("{slug}", slug);
}

export function getApiPublicUrl(): string {
  return (process.env.API_PUBLIC_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  );
}

/** GitHub rejects webhook URLs that are not reachable on the public internet. */
export function isPublicWebhookUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    const host = hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1"
    ) {
      return false;
    }
    if (/^10\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}
