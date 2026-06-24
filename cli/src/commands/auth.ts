import {
  getDefaultApiUrl,
  getDefaultDeployTemplate,
  getConfigPath,
  saveConfig,
  clearConfig,
  loadConfig,
} from "../lib/config";
import { login, getMe } from "../lib/api";
import { loginViaBrowser } from "../lib/browserLogin";
import { fail, ok, info, dieIfApiError } from "../lib/ui";

export async function loginCommand(opts: {
  username?: string;
  password?: string;
  token?: string;
  apiUrl?: string;
  deployUrl?: string;
  browser?: boolean;
}): Promise<void> {
  const apiUrl = (opts.apiUrl ?? getDefaultApiUrl()).replace(/\/$/, "");
  const deployUrlTemplate = opts.deployUrl ?? getDefaultDeployTemplate();

  if (opts.token) {
    const config = {
      apiUrl,
      token: opts.token,
      deployUrlTemplate,
    };
    try {
      const me = await getMe(config);
      saveConfig({ ...config, username: me.user.username });
      ok(`Authenticated as ${me.user.username}`);
      return;
    } catch (err) {
      dieIfApiError(err);
    }
  }

  const useBrowser =
    opts.browser !== false && !opts.username && !opts.password;

  if (useBrowser) {
    try {
      info("Opening browser to sign in...");
      const { token, username } = await loginViaBrowser(apiUrl, {
        onWaiting: () => {
          info("Waiting for authorization in the browser...");
        },
      });
      saveConfig({
        apiUrl,
        token,
        username,
        deployUrlTemplate,
      });
      ok(`Logged in as ${username}`);
      ok(`Config saved to ${getConfigPath()}`);
      return;
    } catch (err) {
      if (err instanceof Error) fail(err.message);
      dieIfApiError(err);
    }
  }

  if (!opts.username || !opts.password) {
    fail(
      "Username and password required for non-browser login. Run `hostic login` without flags to use the browser."
    );
  }

  try {
    const { token } = await login(apiUrl, opts.username, opts.password);
    saveConfig({
      apiUrl,
      token,
      username: opts.username,
      deployUrlTemplate,
    });
    ok(`Logged in as ${opts.username}`);
    ok(`Config saved to ${getConfigPath()}`);
  } catch (err) {
    dieIfApiError(err);
  }
}

export function logoutCommand(): void {
  clearConfig();
  ok("Logged out");
}

export async function whoamiCommand(opts: { apiUrl?: string }): Promise<void> {
  const existing = loadConfig();
  const apiUrl = opts.apiUrl ?? existing?.apiUrl ?? getDefaultApiUrl();
  const token = process.env.HOSTIC_TOKEN ?? existing?.token;

  if (!token) {
    fail("Not logged in. Run `hostic login`.");
  }

  try {
    const me = await getMe({
      apiUrl: apiUrl.replace(/\/$/, ""),
      token,
      deployUrlTemplate:
        existing?.deployUrlTemplate ?? getDefaultDeployTemplate(),
    });
    ok(`${me.user.username} <${me.user.email}>`);
    console.log(`API: ${apiUrl}`);
  } catch (err) {
    dieIfApiError(err);
  }
}
