import { Command } from "commander";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/auth";
import { deployCommand, listCommand, redeployCommand } from "./commands/deploy";
import { getDefaultApiUrl, getDefaultDeployTemplate } from "./lib/config";

export function run(argv: string[]): void {
  const program = new Command();

  program
    .name("hostic")
    .description("Deploy projects to Hostic from your terminal")
    .version("0.1.0");

  program
    .command("login")
    .description("Authenticate with your Hostic account (opens browser by default)")
    .option("-u, --username <username>", "Sign in with username/password instead")
    .option("-p, --password <password>", "Password (use with --username)")
    .option("--token <jwt>", "Save an existing API token (CI / scripts)")
    .option("--no-browser", "Do not open browser; require --username and --password")
    .option(
      "--api-url <url>",
      "API base URL",
      getDefaultApiUrl()
    )
    .option(
      "--deploy-url <template>",
      "Deployed site URL template with {slug}",
      getDefaultDeployTemplate()
    )
    .action(async (opts) => {
      await loginCommand({
        username: opts.username,
        password: opts.password,
        token: opts.token,
        apiUrl: opts.apiUrl,
        deployUrl: opts.deployUrl,
        browser: opts.browser !== false,
      });
    });

  program
    .command("logout")
    .description("Remove saved credentials")
    .action(() => logoutCommand());

  program
    .command("whoami")
    .description("Show the logged-in user")
    .option("--api-url <url>")
    .action(async (opts) => {
      await whoamiCommand(opts);
    });

  program
    .command("deploy")
    .description(
      "Deploy or redeploy — rebuilds an existing deployment when the repo (and directory) already exists"
    )
    .option("--slug <slug>", "Custom subdomain slug (e.g. my-app)")
    .option("--repo <url>", "GitHub repo URL (auto-detected from git remote)")
    .option("--branch <branch>", "Branch to build (default: current branch)")
    .option("--dir <path>", "Subdirectory with package.json (auto-detected in monorepos)")
    .option("--install <cmd>", "Install command (default: npm ci)")
    .option("--build <cmd>", "Build command (default: npm run build)")
    .option(
      "--type <type>",
      "Project type: react | vite | static",
      undefined
    )
    .option("--new", "Force a new deployment even if one already exists")
    .option("--cwd <path>", "Working directory", process.cwd())
    .option("--no-wait", "Queue build and exit without waiting")
    .option("--api-url <url>")
    .action(async (opts) => {
      await deployCommand({
        slug: opts.slug,
        repo: opts.repo,
        branch: opts.branch,
        dir: opts.dir,
        install: opts.install,
        build: opts.build,
        type: opts.type,
        cwd: opts.cwd,
        noWait: opts.noWait,
        newDeployment: opts.new,
        apiUrl: opts.apiUrl,
      });
    });

  program
    .command("redeploy [target]")
    .description("Redeploy an existing deployment by slug or id")
    .option("--no-wait", "Queue build and exit without waiting")
    .option("--api-url <url>")
    .action(async (target, opts) => {
      if (!target) failTarget();
      await redeployCommand({
        target,
        noWait: opts.noWait,
        apiUrl: opts.apiUrl,
      });
    });

  program
    .command("list")
    .description("List your deployments")
    .option("--api-url <url>")
    .action(async (opts) => {
      await listCommand(opts);
    });

  program.parse(argv);
}

function failTarget(): never {
  console.error("Provide a deployment slug or id");
  process.exit(1);
}
