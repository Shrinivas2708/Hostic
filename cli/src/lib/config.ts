import fs from "fs";
import os from "os";
import path from "path";

export type HosticConfig = {
  apiUrl: string;
  token: string;
  username?: string;
  deployUrlTemplate: string;
};

const CONFIG_DIR = path.join(os.homedir(), ".hostic");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_API_URL = "http://localhost:5000/api";
const DEFAULT_DEPLOY_TEMPLATE = "http://{slug}.localhost:8080";

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): HosticConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const data = JSON.parse(raw) as Partial<HosticConfig>;
    if (!data.token || !data.apiUrl) return null;
    return {
      apiUrl: data.apiUrl,
      token: data.token,
      username: data.username,
      deployUrlTemplate: data.deployUrlTemplate ?? DEFAULT_DEPLOY_TEMPLATE,
    };
  } catch {
    return null;
  }
}

export function saveConfig(config: HosticConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

export function resolveConfig(
  overrides: Partial<Pick<HosticConfig, "apiUrl" | "token">> = {}
): HosticConfig {
  const file = loadConfig();
  const token =
    overrides.token ?? process.env.HOSTIC_TOKEN ?? file?.token ?? "";
  const apiUrl =
    overrides.apiUrl ??
    process.env.HOSTIC_API_URL ??
    file?.apiUrl ??
    DEFAULT_API_URL;

  if (!token) {
    throw new Error(
      "Not authenticated. Run `hostic login` or set HOSTIC_TOKEN."
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    token,
    username: file?.username,
    deployUrlTemplate:
      process.env.HOSTIC_DEPLOY_URL_TEMPLATE ??
      file?.deployUrlTemplate ??
      DEFAULT_DEPLOY_TEMPLATE,
  };
}

export function getDeploymentUrl(
  slug: string,
  template = DEFAULT_DEPLOY_TEMPLATE
): string {
  return template.replace("{slug}", slug);
}

export function getDefaultApiUrl(): string {
  return DEFAULT_API_URL;
}

export function getDefaultDeployTemplate(): string {
  return DEFAULT_DEPLOY_TEMPLATE;
}
