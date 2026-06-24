/** Ngrok free tier returns an HTML warning page without CORS headers unless this is set. */
export function applyNgrokHeaders(
  headers: Record<string, string>,
  baseUrl?: string
): void {
  if (!baseUrl) return;
  if (baseUrl.includes("ngrok-free.app") || baseUrl.includes("ngrok.app")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
}
