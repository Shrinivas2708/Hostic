/** Lowercase hostname-safe slug for deployment subdomains. */
export function normalizeDeploymentSlug(input: string): string | null {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length < 2 || slug.length > 48) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) return null;
  return slug;
}
