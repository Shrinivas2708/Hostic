## Hostic — Lightweight Frontend Hosting Platform

Hostic is a minimal, production-ready platform to deploy static and SPA frontend apps from GitHub. It clones your repo, installs and builds inside an isolated Docker container, uploads build artifacts to Cloudflare R2, serves them via a smart proxy on custom subdomains, and streams build logs live over WebSockets.

Deploy from the **dashboard** or the **`hostic` CLI** — same pipeline either way.

### Why Hostic

- **Simple**: Connect GitHub, pick a repo, deploy — install/build commands autodetected from `package.json`.
- **CLI-first option**: `hostic login` → `hostic deploy --slug my-app` from any cloned repo.
- **Isolated builds**: Each build runs in a fresh Node 20 Docker container.
- **Fast rebuilds**: Per-deployment git cache and R2-backed npm dependency cache.
- **Fast static hosting**: Artifacts streamed from R2 via signed URLs.
- **Live feedback**: Realtime logs and statuses via Redis + Socket.IO on the API.
- **Push-to-deploy**: GitHub webhooks auto-redeploy when the API is publicly reachable.
- **Multi-deploy**: Per-user deployments with unique slugs and redeploys.

---

## Architecture

| Package | Role |
|---------|------|
| `api/` | REST API (Express + MongoDB) **and** Socket.IO for live build logs. Build worker, GitHub OAuth/webhooks. |
| `proxy/` | Public edge proxy. Serves each deployment at `{slug}.localhost:8080` (local) or `https://{slug}.apps.yourdomain.com` (prod). |
| `frontend/` | React dashboard — auth, GitHub repo picker, deploy, live logs, deployment list. |
| `cli/` | Terminal tool (`hostic`) — login, deploy, redeploy, list. |

### High-level Flow

1. User authenticates (dashboard or CLI) and deploys with repo URL, commands, optional `slug` and `buildDir`.
2. API creates a `Deployment` + queued `Build`, enqueues a build job, optionally registers a GitHub webhook.
3. Worker syncs git cache, runs install+build in Docker, uploads artifacts to R2, updates MongoDB.
4. Proxy serves the latest successful build for `slug` via signed R2 URLs; shows a building page while in progress.
5. Socket.IO on the API streams logs and status to the dashboard; CLI polls and prints logs in the terminal.

---

## System Architecture

<img width="1492" height="720" alt="image" src="https://github.com/user-attachments/assets/1fc2f80c-82a0-4dc4-801d-2c6d2f270a34" />

---

## Key Components

### Build Orchestration (`api/src/utils/*`)

- `buildQueue.ts` — in-memory FIFO, single concurrency by default
- `worker.ts` — git cache, Docker install/build, artifact upload
- `deploymentCache.ts` — per-deployment git fetch cache, `buildDir` resolution
- `depsCache.ts` — R2-backed npm cache keyed by lockfile hash
- `dockercmd.ts` + `runStreaming.ts` — Docker with live stdout/stderr streaming
- `detectArtifactPath.ts` + `findProjectRoot.ts` — output and monorepo detection
- `projectDefaults.ts` — autodetect install/build/type from `package.json`
- `githubWebhooks.ts` — register webhooks for push-to-deploy
- `upload.ts` — recursive R2 upload
- `logger.ts` + `socketServer.ts` — logs/status via Redis → Socket.IO
- `imagesHandle.ts` — Puppeteer + ImageKit preview screenshots

### CLI (`cli/`)

```bash
cd cli && npm install && npm run build && npm link

hostic login
hostic deploy --slug my-app
hostic redeploy my-app
hostic list
```

See `cli/README.md` for all options. Publish to npm as `hostic-cli`.

### Serving Layer (`proxy/`)

- `APPS_DOMAIN` config — local: `localhost` → `{slug}.localhost:8080`
- SPA fallback, building page, presigned R2 streaming

---

## API Surface (selected)

Base: `/api`

**Auth:** `POST /auth/signup`, `POST /auth/login`, `DELETE /auth/delete`, `PATCH /auth/update`

**User:** `GET /user/me`

**Deploy:**
- `POST /host` — create deployment (optional `slug`, `buildDir`, `branch`)
- `POST /host/redeploy` — new build for existing deployment
- `GET /host`, `GET /host/deployment`, `DELETE /host/delete`
- `GET /host/builds`, `GET /host/build`
- `POST /host/getimg` — preview screenshot
- `GET /host/webhook`, `PATCH /host/auto-deploy`, `POST /host/webhook/regenerate`

**GitHub:**
- `GET /github/connect`, `GET /github/callback`, `GET /github/status`
- `GET /github/repos`, `GET /github/repos/:owner/:repo`
- `GET /github/repos/:owner/:repo/detect` — autodetect install/build/type

**Webhooks:** `POST /webhooks/github/:webhookSecret` — GitHub push (HMAC verified)

---

## Local Development

**Requirements:** Node 20+, Docker, MongoDB, Redis, R2 credentials

### Environment

**API** (`api/.env`):

```
PORT=5000
DATABASE_URL=mongodb://localhost:27017/hostic
JWT_SECRET=replace-me
REDIS_URL=redis://localhost:6379
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=<bucket-name>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
API_PUBLIC_URL=http://localhost:5000
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
FRONTEND_URL=http://localhost:5173
DEPLOY_URL_TEMPLATE=http://{slug}.localhost:8080
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

**Proxy** (`proxy/.env`):

```
PORT=8080
DATABASE_URL=mongodb://localhost:27017/hostic
APPS_DOMAIN=localhost
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
```

**Frontend** (`frontend/.env`):

```
VITE_API_URL=http://localhost:5000/api
VITE_DEPLOY_URL_TEMPLATE=http://{slug}.localhost:8080
```

### Install & Run

```bash
cd api && npm i && npm run dev      # :5000 — API + Socket.IO
cd proxy && npm i && npm run dev    # :8080
cd frontend && npm i && npm run dev # :5173

# Optional CLI
cd cli && npm i && npm run build && npm link
```

Do **not** run a separate `socket/` service — Socket.IO is merged into the API.

---

## Deploying a Project

### Dashboard

1. Login/signup.
2. Open Deploy → connect GitHub → pick a repo (commands autofill from `package.json`).
3. Watch live logs on the build page.
4. Visit `http://{slug}.localhost:8080` when the build succeeds.

### CLI

```bash
hostic login
cd my-vite-app
hostic deploy --slug my-app
```

Push changes, run `hostic deploy --slug my-app` again — same slug, new build.

---

## Notes and Limitations

- Queue is in-memory (single API instance). Use BullMQ for HA.
- Single build concurrency by default.
- Docker required on the API host.
- GitHub webhooks require a public `API_PUBLIC_URL`.
- Public repos only — private repo clone not yet implemented.
- Max 3 deployments per user, max 50 builds per deployment.

---

## Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Current system architecture |
| `Platform.md` | Build lifecycle deep dive |
| `cli/README.md` | CLI reference |
| `INTERVIEW_PITCH.md` | Interview elevator pitch and demo script |
| `INTERVIEW_TECH.md` | Technical deep dive for interviews |
| `DESIGN.md` | UI design tokens |
