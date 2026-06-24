# Hostic CLI

Deploy to [Hostic](https://shribuilds.in) from your terminal — same pipeline as the dashboard, no UI required.

## Install

From this monorepo (development):

```bash
cd cli
npm install
npm run build
npm link
```

Publish later: `npm publish` as `hostic-cli` (binary: `hostic`).

## Quick start

```bash
# 1. Log in — opens your browser (like Vercel / GitHub CLI)
hostic login

# 2. From a cloned GitHub repo (first time creates; later runs rebuild)
cd my-vite-app
hostic deploy --slug my-app

# 3. Push changes, then deploy again — same slug, new build
hostic deploy --slug my-app
# or: hostic redeploy my-app
```

In the browser: sign in (if needed) → click **Authorize CLI** → return to terminal.

Non-browser: `hostic login --no-browser -u USER -p PASS`

## Commands

| Command | Description |
|---------|-------------|
| `hostic login` | Save credentials to `~/.hostic/config.json` |
| `hostic logout` | Remove saved credentials |
| `hostic whoami` | Show logged-in user |
| `hostic deploy` | Deploy or redeploy (rebuilds if repo already exists) |
| `hostic redeploy <slug\|id>` | Trigger a new build for a deployment |
| `hostic list` | List deployments |

### `hostic deploy` options

| Flag | Description |
|------|-------------|
| `--slug` | Custom subdomain (e.g. `my-app` → `my-app.localhost:8080`) |
| `--new` | Always create a new deployment (skip redeploy detection) |
| `--repo` | GitHub URL (default: `git remote origin`) |
| `--branch` | Branch to build (default: current branch) |
| `--dir` | Subdirectory with `package.json` (default: `./`) |
| `--install` | Install command (default: `npm ci` if lockfile exists) |
| `--build` | Build command (default: `npm run build`) |
| `--type` | `react` \| `vite` \| `static` (auto-detected) |
| `--no-wait` | Queue and exit without streaming logs |
| `--api-url` | Override API base URL |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `HOSTIC_TOKEN` | JWT (skips saved config) |
| `HOSTIC_API_URL` | API base URL |
| `HOSTIC_DEPLOY_URL_TEMPLATE` | e.g. `https://{slug}.apps.shribuilds.in` |

## Production example

```bash
hostic login --api-url https://api.shribuilds.in/api \
  --deploy-url https://{slug}.apps.shribuilds.in

hostic deploy --slug my-app
```

## How it works

1. CLI authenticates with `POST /api/auth/login`
2. Detects `origin` remote + current branch (or uses flags)
3. If a deployment already exists for this `--slug` or repo + directory → `POST /api/host/redeploy`
4. Otherwise → `POST /api/host/` (new deployment)
5. Polls `GET /api/host/build?build_name=...` until success/failed
6. Prints your live URL from the deploy URL template

Builds run on the Hostic worker (Docker) — the CLI does not upload local `dist/`; it triggers a remote build from your Git repo, identical to the dashboard flow.
