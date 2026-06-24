import path from "path";
import {
  createDeployment,
  getDeployment,
  listDeployments,
  redeploy,
} from "../lib/api";
import {
  getDeploymentUrl,
  resolveConfig,
} from "../lib/config";
import {
  detectGitContext,
  detectProjectDefaults,
  buildDirFromProjectPath,
  normalizeBuildDirForMatch,
  normalizeRepoUrl,
} from "../lib/project";
import { waitForBuild } from "../lib/poll";
import { dieIfApiError, fail, info, ok, warn } from "../lib/ui";
import type { DeploymentDetail } from "../lib/api";

export async function deployCommand(opts: {
  slug?: string;
  repo?: string;
  branch?: string;
  dir?: string;
  install?: string;
  build?: string;
  type?: string;
  cwd?: string;
  noWait?: boolean;
  newDeployment?: boolean;
  apiUrl?: string;
}): Promise<void> {
  const config = resolveConfig(
    opts.apiUrl ? { apiUrl: opts.apiUrl } : {}
  );
  const cwd = path.resolve(opts.cwd ?? process.cwd());

  let repoUrl = opts.repo ? normalizeRepoUrl(opts.repo) : undefined;
  let branch = opts.branch;
  let buildDir = opts.dir;

  if (!repoUrl) {
    const git = await detectGitContext(cwd);
    if (!git) {
      fail(
        "No git repository found (searched this folder and parents). Hostic builds from a GitHub URL — push your code and pass --repo, or run from inside a git clone."
      );
    }
    repoUrl = git.repoUrl;
    branch = branch ?? git.branch;
    if (!buildDir && git.projectDir) {
      buildDir = buildDirFromProjectPath(git.projectDir);
    }
    info(`Repository: ${repoUrl}`);
    info(`Branch: ${branch}`);
    if (buildDir && buildDir !== "./") {
      info(`Build directory: ${buildDir}`);
    }
  }

  const defaults = detectProjectDefaults(cwd);
  const project_type = opts.type ?? defaults.project_type;
  const installCommands = opts.install ?? defaults.installCommands;
  const buildCommands = opts.build ?? defaults.buildCommands;
  buildDir = buildDir ?? "./";

  try {
    const existing =
      opts.newDeployment === true
        ? null
        : await findExistingDeployment(config, {
            slug: opts.slug,
            repoUrl,
            buildDir,
          });

    if (existing) {
      info(`Redeploying ${existing.slug} (existing deployment)...`);
      const result = await redeploy(config, existing._id);
      info(`Build: ${result.build_name}`);

      if (opts.noWait) {
        ok(`Redeploy queued — slug: ${result.slug}`);
        console.log(getDeploymentUrl(result.slug, config.deployUrlTemplate));
        return;
      }

      await watchBuild(config, result.build_name, result.slug);
      return;
    }

    info("Creating new deployment on Hostic...");

    const result = await createDeployment(config, {
      repo_url: repoUrl,
      project_type,
      installCommands,
      buildCommands,
      buildDir,
      branch,
      slug: opts.slug,
    });

    info(`Build: ${result.build_name}`);
    info(`Deployment: ${result.deployment_id}`);

    if (opts.noWait) {
      ok(`Queued — slug: ${result.slug}`);
      console.log(getDeploymentUrl(result.slug, config.deployUrlTemplate));
      return;
    }

    await watchBuild(config, result.build_name, result.slug);
  } catch (err) {
    dieIfApiError(err);
  }
}

export async function redeployCommand(opts: {
  target: string;
  noWait?: boolean;
  apiUrl?: string;
}): Promise<void> {
  const config = resolveConfig(
    opts.apiUrl ? { apiUrl: opts.apiUrl } : {}
  );

  const deploymentId = await resolveDeploymentId(config, opts.target);

  try {
    const result = await redeploy(config, deploymentId);
    info(`Build: ${result.build_name}`);

    if (opts.noWait) {
      ok(`Redeploy queued — slug: ${result.slug}`);
      return;
    }

    await watchBuild(config, result.build_name, result.slug);
  } catch (err) {
    dieIfApiError(err);
  }
}

export async function listCommand(opts: { apiUrl?: string }): Promise<void> {
  const config = resolveConfig(
    opts.apiUrl ? { apiUrl: opts.apiUrl } : {}
  );

  try {
    const { deployments } = await listDeployments(config);
    if (deployments.length === 0) {
      warn("No deployments yet");
      return;
    }

    for (const d of deployments) {
      const url = getDeploymentUrl(d.slug, config.deployUrlTemplate);
      console.log(`${d.slug.padEnd(28)} ${d._id}`);
      console.log(`  ${url}`);
    }
  } catch (err) {
    dieIfApiError(err);
  }
}

async function resolveDeploymentId(
  config: ReturnType<typeof resolveConfig>,
  target: string
): Promise<string> {
  if (/^[a-f\d]{24}$/i.test(target)) return target;

  const { deployments } = await listDeployments(config);
  const match = deployments.find((d) => d.slug === target);
  if (!match) {
    const detail = await getDeploymentBySlug(config, target);
    if (detail) return detail._id;
    fail(`No deployment found for "${target}"`);
  }
  return match._id;
}

async function getDeploymentBySlug(
  config: ReturnType<typeof resolveConfig>,
  slug: string
) {
  const { deployments } = await listDeployments(config);
  const item = deployments.find((d) => d.slug === slug);
  if (!item) return null;
  const { deployment } = await getDeployment(config, item._id);
  return deployment;
}

function deploymentMatchesRepo(
  deployment: DeploymentDetail,
  repoUrl: string,
  buildDir: string
): boolean {
  return (
    normalizeRepoUrl(deployment.repo_url) === normalizeRepoUrl(repoUrl) &&
    normalizeBuildDirForMatch(deployment.buildDir) ===
      normalizeBuildDirForMatch(buildDir)
  );
}

async function findExistingDeployment(
  config: ReturnType<typeof resolveConfig>,
  opts: { slug?: string; repoUrl: string; buildDir: string }
): Promise<DeploymentDetail | null> {
  const { deployments } = await listDeployments(config);

  if (opts.slug) {
    const item = deployments.find((d) => d.slug === opts.slug);
    if (!item) return null;
    const { deployment } = await getDeployment(config, item._id);
    return deployment;
  }

  const matches: DeploymentDetail[] = [];
  for (const item of deployments) {
    const { deployment } = await getDeployment(config, item._id);
    if (deploymentMatchesRepo(deployment, opts.repoUrl, opts.buildDir)) {
      matches.push(deployment);
    }
  }

  if (matches.length === 0) return null;

  if (matches.length === 1) return matches[0];

  const slugs = matches.map((d) => `  ${d.slug}`).join("\n");
  fail(
    `Multiple deployments match this repo. Pick one:\n${slugs}\n\nUse: hostic redeploy <slug>  or  hostic deploy --slug <slug>`
  );
}

async function watchBuild(
  config: ReturnType<typeof resolveConfig>,
  buildName: string,
  slug: string
): Promise<void> {
  const siteUrl = getDeploymentUrl(slug, config.deployUrlTemplate);

  const build = await waitForBuild(config, buildName, {
    onStatus: (b) => {
      if (b.status === "building") info("Building...");
    },
    onLogLine: (line) => {
      if (line.trim()) console.log(`  ${line}`);
    },
  });

  if (build.status === "success") {
    ok(`Published at ${siteUrl.replace(/^https?:\/\//, "")}`);
    console.log(siteUrl);
    return;
  }

  fail(`Build failed (${buildName})`);
}
