import type { HosticConfig } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(
  config: HosticConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${config.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export type LoginResponse = { token: string; message: string };

export type DeployResponse = {
  deployment_id: string;
  build_id: string;
  build_name: string;
  slug: string;
  status: string;
};

export type BuildRecord = {
  build_name: string;
  status: "queued" | "building" | "failed" | "success";
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  logs?: Array<{ level: string; message: string; at: number }>;
};

export type DeploymentListItem = {
  _id: string;
  slug: string;
  img_url?: string;
};

export type DeploymentDetail = {
  _id: string;
  slug: string;
  repo_url: string;
  branch: string;
  buildDir?: string;
  projectType: string;
  installCommands?: string;
  buildCommands?: string;
};

export async function login(
  apiUrl: string,
  username: string,
  password: string
): Promise<LoginResponse> {
  const url = `${apiUrl.replace(/\/$/, "")}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(
      (data as { message?: string })?.message ?? "Login failed",
      res.status,
      data
    );
  }
  return data as LoginResponse;
}

export async function getMe(config: HosticConfig) {
  return apiRequest<{ user: { username: string; email: string } }>(
    config,
    "GET",
    "/user/me"
  );
}

export async function createDeployment(
  config: HosticConfig,
  body: {
    repo_url: string;
    project_type: string;
    installCommands: string;
    buildCommands: string;
    buildDir?: string;
    branch?: string;
    slug?: string;
  }
) {
  return apiRequest<DeployResponse>(config, "POST", "/host/", body);
}

export async function redeploy(config: HosticConfig, deployment_id: string) {
  return apiRequest<DeployResponse>(config, "POST", "/host/redeploy", {
    deployment_id,
  });
}

export async function listDeployments(config: HosticConfig) {
  return apiRequest<{ deployments: DeploymentListItem[] }>(
    config,
    "GET",
    "/host/"
  );
}

export async function getDeployment(config: HosticConfig, deployment_id: string) {
  return apiRequest<{ deployment: DeploymentDetail }>(
    config,
    "GET",
    `/host/deployment?deployment_id=${encodeURIComponent(deployment_id)}`
  );
}

export async function getBuild(config: HosticConfig, build_name: string) {
  return apiRequest<{ build: BuildRecord }>(
    config,
    "GET",
    `/host/build?build_name=${encodeURIComponent(build_name)}`
  );
}
