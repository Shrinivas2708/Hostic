## Hostic Platform — Deep Dive

This document explains what Hostic does under the hood: how deployments are created, built, stored, and served; how logs and statuses flow; and how the UI, API, CLI, proxy, and GitHub integration work together.

For the most current architecture overview, see `ARCHITECTURE.md`.

---

## System Overview

- `frontend/`: React dashboard — login, GitHub repo picker, deploy form with autodetection, live build logs, deployment list.
- `cli/`: Terminal tool (`hostic`) — login, deploy, redeploy, list; same REST API as the dashboard.
- `api/`: Express + MongoDB + in-process build worker + Socket.IO on the same HTTP port. Orchestrates builds, GitHub OAuth/webhooks, uploads to R2, publishes logs/status to Redis.
- `proxy/`: Edge Express server. Serves each deployment by streaming build output from R2 via presigned URLs, with SPA fallback and a building page.

Key external dependencies:
- Docker (isolated builds)
- MongoDB (users, deployments, builds, logs)
- Redis (pub/sub for live logs and status)
- Cloudflare R2 (artifacts + optional dependency cache)
- GitHub (OAuth, repo listing, push webhooks)
- ImageKit (deployment preview images)

---

## Data Model

- `User`
  - `username`, `email`, `password` (plain in this repo; hash in production)
  - `deployments_count` — quota: max 3 deployments

- `Deployments`
  - `slug` (unique, user-chosen or generated), `repo_url`, `branch`
  - `projectType`, `installCommands`, `buildCommands`, `buildDir?`
  - `current_build_id`, `buildNo` (max 50 builds per deployment)
  - GitHub: `githubWebhookId`, `autoDeploy`, `webhookSecret`, etc.
  - Preview: `img_url`, `img_id`, `image_build_id`

- `Builds`
  - `build_name` (short id), `status` (queued/building/success/failed)
  - `artifact_path` (R2 prefix), timings
  - `triggeredBy`: `manual` | `webhook`
  - `logs[]` persisted during/after build

---

## Build Lifecycle

1) A client (dashboard or CLI) calls `POST /api/host`. The API:
   - Verifies user quota (max 3 deployments)
   - Creates a `Deployment` (optional custom `slug`)
   - Creates an initial `Build` (status `queued`)
   - Registers a GitHub webhook when `API_PUBLIC_URL` is publicly reachable
   - Enqueues a `BuildJob` in an in-memory queue

2) The worker (`processJob` in `worker.ts`):
   - Publishes `building` status via Redis
   - Syncs git cache under `tmp/hostit-cache/{deploymentId}/repo`
   - Copies source to `tmp/hostit-builds/{buildId}`
   - Resolves project root from `buildDir` or auto-detects `package.json`
   - Deps cache: if lockfile hash matches R2 tarball → extract and skip install; else Docker install → upload cache
   - Runs build in a separate Docker step
   - Streams stdout/stderr to Redis via `logger.ts`
   - Detects artifacts (`dist|build|public|out`)
   - Uploads to R2 under `__output/{slug}/{buildId}/`
   - Updates MongoDB, publishes `success` or `failed`
   - Batches logs to `Builds.logs[]`, cleans workspace

3) Redeploy triggers:
   - Dashboard: `POST /api/host/redeploy`
   - CLI: `hostic deploy` when slug/repo+dir already exists, or `hostic redeploy`
   - GitHub: `POST /api/webhooks/github/:secret` on push to configured branch

Concurrency: `buildQueue.ts` enforces `MAX_CONCURRENT = 1` by default.

---

## Serving Architecture (Proxy)

- Local: `http://{slug}.localhost:8080` when `APPS_DOMAIN=localhost`
- Production: `https://{slug}.apps.yourdomain.com` when `APPS_DOMAIN=apps.yourdomain.com`
- Proxy extracts `slug` from the `Host` header (`proxy/src/config.ts`)
- If build is `queued`/`building` → `public/building.html`
- If `success` → presigned R2 GET with SPA fallback to `/index.html`

---

## Realtime Logs & Status

- Worker publishes to Redis `logs:{buildId}` and `status:{buildId}`
- Socket.IO on the API server (`socketServer.ts`) subscribes and emits to browsers
- Frontend connects to API origin (port 5000), not a separate socket service
- CLI polls `GET /api/host/build` and formats log output in the terminal

Events:
- `log` — structured log entry
- `status` — `queued | building | failed | success`

---

## GitHub Integration

- OAuth connect flow: `/api/github/connect` → callback stores token on user
- Repo listing and details for the deploy UI
- Autodetection: `GET /api/github/repos/:owner/:repo/detect` reads `package.json` and suggests install/build/type
- Webhooks: registered on deploy when API is public; push to matching branch triggers redeploy

---

## CLI

Package: `cli/` (`hostic-cli` on npm, binary `hostic`)

```bash
hostic login
hostic deploy --slug my-app
hostic redeploy my-app
hostic list
hostic whoami
```

Config: `~/.hostic/config.json` or `HOSTIC_TOKEN` / `HOSTIC_API_URL` env vars.

See `cli/README.md` for full command reference.

---

## Security Notes & Production Hardening

- Hash passwords (bcrypt/argon2) and use TLS in production
- Persistent queue (BullMQ) for HA
- Docker timeouts and CPU/memory limits
- Validate `repo_url`; sandbox or allowlist shell commands
- Per-user rate limiting
- Private repo support via GitHub App or deploy keys
- R2 lifecycle rules for old builds

---

## Environment Variables

API:
- `PORT`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`
- `R2_*`, `IMAGEKIT_*`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- `API_PUBLIC_URL`, `FRONTEND_URL`, `DEPLOY_URL_TEMPLATE`
- `DEPS_CACHE_SYNC_R2` (optional R2 deps cache sync)

Proxy:
- `PORT`, `DATABASE_URL`, `APPS_DOMAIN`
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

Frontend:
- `VITE_API_URL`, `VITE_DEPLOY_URL_TEMPLATE`
- `VITE_SOCKET_URL` (optional — defaults to API origin without `/api`)

---

## Operational Runbooks

- Scale builds: increase `MAX_CONCURRENT` or move to BullMQ; horizontal workers
- Cleanup: workspaces removed after each build; R2 lifecycle for old artifacts
- Observability: external log sink (Loki/ELK); metrics on build duration and failure rate
- Backups: MongoDB; rotate secrets periodically

---

## Roadmap Ideas

- Private GitHub repos
- Custom domains and SSL via DNS automation
- Team/org model with roles
- Publish `hostic-cli` to npm
- Canary deploys and rollbacks
