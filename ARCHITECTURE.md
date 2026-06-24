# Hostic — Architecture

How the app works today: services, data flow, build pipeline, caching, and realtime updates.

---

## What Hostic Is

A lightweight frontend hosting platform (mini-Vercel). Users connect a GitHub repo, define install/build commands, and Hostic:

1. Clones the repo and builds inside Docker (`node:20`)
2. Uploads static output to **Cloudflare R2**
3. Serves the site on a **per-deployment subdomain** via a proxy
4. Streams **live build logs** to the dashboard over WebSockets

---

## Monorepo Layout

```
Hostic/
├── api/          Express API + Socket.IO + in-process build worker
├── proxy/        Public edge server (subdomain → R2)
├── frontend/     React dashboard (Vite)
└── cli/          Terminal deploy tool (`hostic` binary)
```

| Service   | Port (local) | Role |
|-----------|--------------|------|
| `api`     | 5000         | REST, WebSocket logs, auth, builds, GitHub, worker |
| `proxy`   | 8080         | Serve deployed apps to visitors |
| `frontend`| 5173         | User dashboard |

All services share **MongoDB** for metadata. **Redis** is used only for build pub/sub. **R2** stores build artifacts and dependency caches.

---

## System Diagram

```
┌─────────────┐   REST + Socket.IO   ┌─────────────┐
│   Browser   │ ───────────────────► │     API     │
│  (React)    │   (same port :5000)  │  + Worker   │
└──────┬──────┘                      └──────┬──────┘
       │                                    ├──► MongoDB
       │                                    ├──► Redis (pub/sub)
       │                                    ├──► Docker (builds)
       │                                    └──► R2 (upload)
       │
       │  HTTPS  {slug}.apps.shribuilds.in
       ▼
┌─────────────┐
│    Proxy    │ ──► MongoDB (lookup slug → build)
└─────────────┘ ──► R2 (presigned URL stream)
```

---

## Core User Flows

### 1. Deploy (manual)

1. User signs up / logs in → JWT stored in frontend (`authStore`)
2. User picks a GitHub repo (OAuth) and fills deploy form: `project_type`, `installCommands`, `buildCommands`, `buildDir`, `branch`
3. `POST /api/host` creates a `Deployment` + queued `Build`, enqueues worker job
4. User lands on **Build page** → Socket.IO subscribes to `buildId` for live logs
5. On success → redirect to deployed preview; site is live at `{slug}.apps.shribuilds.in` (or local template)

### 2. Redeploy

1. `POST /api/host/redeploy` with `deployment_id`
2. New `Build` record + queue job; same deployment `slug`, new artifact prefix in R2

### 3. Auto-deploy (GitHub push)

1. On deploy, API registers a GitHub webhook (if `API_PUBLIC_URL` is publicly reachable)
2. `POST /api/webhooks/github/:webhookSecret` verifies HMAC, matches repo + branch
3. Triggers `triggerDeploymentBuild(..., { triggeredBy: "webhook" })`

> Local dev: webhooks are skipped when `API_PUBLIC_URL` is `localhost` — deploy the API publicly for push-to-deploy.

---

## Build Pipeline (`api/src/utils/worker.ts`)

Single-concurrency in-memory queue (`buildQueue.ts`, `MAX_CONCURRENT = 1`).

```
Queue job
  │
  ├─► Sync git cache (per deployment)     tmp/hostit-cache/{deploymentId}/repo
  ├─► Copy source → workspace             tmp/hostit-builds/{buildId}
  ├─► Resolve project root from buildDir  (strict if subdir set)
  │
  ├─► Deps cache hit? (R2 + lockfile hash)
  │     yes → download .tar.gz, extract, skip install
  │     no  → docker install → upload deps cache to R2
  │
  ├─► Docker build (separate container step)
  ├─► Detect artifact (dist/build/public) under project root
  ├─► Upload artifacts → R2: __output/{slug}/{buildId}/
  ├─► Update MongoDB (build success, deployment.current_build_id)
  ├─► Publish status → Redis
  └─► Flush logs to MongoDB, cleanup workspace
```

### Key modules

| File | Purpose |
|------|---------|
| `deploymentCache.ts` | Git fetch cache, `buildDir` resolution, lockfile hashing |
| `depsCache.ts` | R2-backed `node_modules` cache (`__deps/{slug}/`) |
| `dockercmd.ts` | `docker run` with project mounted at `/app` |
| `dockerFs.ts` | Windows-safe copy/cleanup via Docker |
| `logger.ts` | Structured logs → Redis + in-memory buffer |
| `persistBuildLogs.ts` | Batched `$push` of logs to `Builds.logs` in MongoDB |
| `upload.ts` | Recursive R2 upload (build output) |
| `detectArtifactPath.ts` | Find `dist` / `build` / `public` under project root |

### Caching strategy

| Cache | Location | Key |
|-------|----------|-----|
| Git repo | Local `tmp/hostit-cache/{deploymentId}/repo` | Per deployment; `git fetch` on redeploy |
| Dependencies | R2 `__deps/{slug}/{lockfileHash}.npm-cache.tar` | Warm npm cache — fast install via `--prefer-offline`, not full `node_modules` |
| Build output | R2 `__output/{slug}/{buildId}/` | Immutable per build |

### Logs

- **Live:** API publishes to Redis `logs:{buildId}` → Socket server → browser
- **Persisted:** Batched writes to `Builds.logs[]` in MongoDB; completed builds load from API, active builds use socket

---

## Serving Layer (`proxy/`)

1. Read `Host` header → extract `slug` (e.g. `my-app` from `my-app.apps.shribuilds.in`)
2. Load `Deployment` by `slug` → follow `current_build_id` → `Build`
3. If build is `queued` / `building` → serve `public/building.html`
4. If `success` → presigned GET from R2 at `{artifact_path}{file}`, SPA fallback to `index.html`

---

## Realtime (Socket.IO on API)

- Socket.IO runs on the **same port as the API** (`api/src/utils/socketServer.ts`)
- Client connects with `?buildId={build_name}`
- Subscribes to Redis `logs:{buildId}` and `status:{buildId}`
- Emits `log` (JSON entries) and `status` events to the React build page

---

## Data Models (MongoDB)

### User
- Auth credentials, `deployments_count` (quota: max 3 deployments)

### Deployment
- `slug`, `repo_url`, `branch`, `projectType`, `installCommands`, `buildCommands`, `buildDir`
- `current_build_id`, `buildNo` (max 50 builds per deployment)
- GitHub: `githubWebhookId`, `githubRepoFullName`, `githubWebhookManaged`, `autoDeploy`, `webhookSecret`
- Preview: `img_url`, `img_id` (ImageKit + Puppeteer screenshot)

### Build
- `build_name` (shortid), `status`, `artifact_path`, `startedAt`, `finishedAt`, `duration`
- `triggeredBy`: `manual` | `webhook`
- `logs[]`: `{ level, message, at }` persisted during/after build

---

## Frontend (`frontend/`)

- **Stack:** React 19, Vite 7, Tailwind CSS v4, Zustand, React Router, HeroUI
- **Stores:** `authStore`, `deployStore`, `githubStore`, `toastStore`
- **Config:** `src/lib/config.ts` — `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_DEPLOY_URL_TEMPLATE`
- **Pages:** Landing, Login/Signup, Deployments, Deploy (GitHub picker + autodetect), Build (live logs), Deployed preview
- **GitHub:** OAuth connect, repo list, `package.json` autodetection on deploy form

Protected routes wrap dashboard pages with JWT check (`ProtectedRoute`).

---

## CLI (`cli/`)

- **Package:** `hostic-cli` — binary `hostic`
- **Commands:** `login`, `logout`, `whoami`, `deploy`, `redeploy`, `list`
- **Config:** `~/.hostic/config.json` or `HOSTIC_TOKEN` / `HOSTIC_API_URL` env vars
- **Behavior:** Detects git remote + branch; redeploys when slug or repo+dir already exists; streams build logs in terminal
- Same REST API as the dashboard — triggers remote Docker builds, does not upload local `dist/`

See `cli/README.md` for install and usage.

---

## API Routes (summary)

| Prefix | Examples |
|--------|----------|
| `/api/auth` | signup, login, delete, update |
| `/api/user` | `GET /me` |
| `/api/host` | deploy, redeploy, list/get/delete deployment, builds, webhook info |
| `/api/github` | OAuth connect, list repos, repo details, package.json detect |
| `/api/webhooks/github/:secret` | GitHub push webhook (raw body, HMAC) |

---

## Environment Variables

### API (`api/.env`)
```
PORT, DATABASE_URL, JWT_SECRET, REDIS_URL
R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL
API_PUBLIC_URL, FRONTEND_URL, DEPLOY_URL_TEMPLATE
IMAGEKIT_* (preview screenshots)
```

### Proxy (`proxy/.env`)
```
PORT, DATABASE_URL, APPS_DOMAIN, R2_* 
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL optional — defaults to API origin without /api
VITE_DEPLOY_URL_TEMPLATE=http://{slug}.localhost:8080
```

---

## Local Development

Run in separate terminals:

```bash
cd api && npm run dev
cd proxy && npm run dev
cd frontend && npm run dev
```

Requires: **Node 20+**, **Docker**, **MongoDB**, **Redis**, **R2 credentials**.

---

## Production URLs

| Resource | URL pattern |
|----------|-------------|
| Dashboard | your frontend host |
| API | `API_PUBLIC_URL` |
| Deployed apps | `https://{slug}.apps.yourdomain.com` (wildcard DNS → proxy) |
| GitHub OAuth callback | `{API_PUBLIC_URL}/api/github/callback` |

Set `APPS_DOMAIN`, `DEPLOY_URL_TEMPLATE`, and `VITE_DEPLOY_URL_TEMPLATE` to match.

---

## Known Limitations

- Build queue is **in-memory** (single API instance; not HA)
- **Single concurrent build** by default
- Docker required on the API host
- GitHub webhooks require a **public** API URL
- User passwords stored without hashing in current codebase (hash before production)

---

## Related Docs

- `README.md` — setup and quick start
- `cli/README.md` — CLI install and commands
- `INTERVIEW_PITCH.md` — interview elevator pitch and demo script
- `INTERVIEW_TECH.md` — deep technical reference for interviews
- `Platform.md` — build lifecycle and operational notes
- `DESIGN.md` — UI/design tokens
