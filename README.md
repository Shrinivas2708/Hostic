## Hostic — Lightweight Frontend Hosting Platform

Hostic is a minimal, production-ready platform to deploy static and SPA frontend apps straight from a Git repo. It clones your repo, installs and builds inside an isolated Docker container, uploads the build artifacts to Cloudflare R2, serves them via a smart proxy on custom subdomains, and streams build logs/status live over WebSockets.

### Why Hostic

- **Simple**: Bring a repo URL and two commands (install, build).
- **Isolated builds**: Each build runs in a fresh Node 20 Docker container.
- **Fast static hosting**: Artifacts streamed directly from R2 via signed URLs.
- **Live feedback**: Realtime logs and statuses via Redis + Socket.IO.
- **Multi-deploy**: Per-user deployments with unique slugs and rebuilds.

---

## Architecture

- `api/` — REST API (Express + MongoDB). Owns users, deployments, builds. Orchestrates builds and publishes logs/status to Redis.
- `socket/` — WebSocket server (Socket.IO). Subscribes to Redis channels and pushes realtime logs/status to clients.
- `proxy/` — Public edge proxy (Express). Serves each deployment at `https://{slug}.apps.shriii.xyz` by streaming artifacts from R2.
- `frontend/` — React app for authentication, deployment creation, logs, and status.

### High-level Flow

1. User authenticates and calls `POST /api/host` with `repo_url`, `project_type`, `installCommands`, `buildCommands`, optional `buildDir`.
2. API creates a `Deployment` (+ initial `Build`) and enqueues a build job.
3. Worker clones the repo, detects project root, runs install+build in Docker, detects build output directory, uploads artifacts to R2, and updates DB.
4. Proxy serves the latest successful build for `slug` via signed R2 URLs; if building, shows a "building" page.
5. Socket server streams logs and status updates to the UI in realtime.

---

## Key Components (Under the Hood)

### Build Orchestration (`api/src/utils/*`)

- `buildQueue.ts`: Simple in-memory FIFO with single concurrency, feeds `processJob`.
- `worker.ts`: Core pipeline — clone repo (simple-git), resolve project root, run `installCommands && buildCommands` inside Docker (`node:20`), detect output (`dist|build|public`), upload to R2, update Mongo, publish logs/status via Redis.
- `dockercmd.ts` + `runStreaming.ts`: Compose and run Docker container with live stdout/stderr streaming to the logger.
- `detectArtifactPath.ts` + `findProjectRoot.ts`: Best-effort discovery of project root and output directory.
- `upload.ts`: Recursive uploader to Cloudflare R2 via AWS SDK v3.
- `logger.ts` + `pub.ts`: Structured timestamps; publish logs to `logs:{buildId}` and status to `status:{buildId}` channels (Redis).
- `imagesHandle.ts`: Uses Puppeteer + ImageKit to capture and store preview thumbnails for deployments.

### Data Model (`api/src/model/*`)

- `User`: `username`, `email`, `password` (plain in this repo; replace with hashing in prod), `deployments_count` with quota controls.
- `Deployments`: `slug`, `repo_url`, `projectType`, `installCommands`, `buildCommands`, `current_build_id`, optional preview image fields, and `buildNo` for redeploy limits.
- `Builds`: per build `status` (queued/building/success/failed), `build_name` (short id), artifact path, timings.

### Serving Layer (`proxy/`)

- Resolves `slug` from `Host` header `*.apps.shriii.xyz`.
- Looks up current successful build; if building, serves `public/building.html`; else streams files from R2 using signed URLs, with SPA fallback.

### Realtime (`socket/`)

- Subscribes to `logs:{buildId}` and `status:{buildId}`; forwards to connected clients via Socket.IO.

---

## API Surface (selected)

Base: `/api`

- `POST /auth/signup` — create user ⇒ `{ token }`
- `POST /auth/login` — login ⇒ `{ token }`
- `DELETE /auth/delete` — delete account (auth)
- `PATCH /auth/update` — update user fields (auth)

- `GET /user/me` — current user (auth)

- `POST /host` — create deployment (auth)
  - body: `{ repo_url, project_type: "react"|"vite"|"static", installCommands, buildCommands, buildDir? }`
  - returns: `{ deployment_id, build_id, build_name, slug, status }`
- `POST /host/redeploy` — enqueue new build for an existing deployment (auth)
- `GET /host` — list deployments (auth)
- `GET /host/deployment?deployment_id=...` — get deployment (auth)
- `DELETE /host/delete` — delete deployment (auth)
- `GET /host/builds?deployment_id=...` — list builds (auth)
- `GET /host/build?build_name=...` — get build by name (auth)
- `POST /host/getimg` — generate or return preview image for latest build (auth)

---

## Local Development

Requirements:

- Node 20+
- Docker (to run isolated builds)
- MongoDB
- Redis

### 1) Environment

Create `.env` files in each service as needed. Required keys:

API (`api/.env`):

```
PORT=5000
DATABASE_URL=mongodb://localhost:27017/hostic
JWT_SECRET=replace-me
REDIS_URL=redis://localhost:6379
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_BUCKET=<bucket-name>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
```

Proxy (`proxy/.env`):

```
PORT=8080
DATABASE_URL=mongodb://localhost:27017/hostic
R2_ACCESS_KEY=<r2-access-key>
R2_SECRET_KEY=<r2-secret>
R2_BUCKET=<bucket-name>
```

Socket (`socket/.env`):

```
REDIS_URL=redis://localhost:6379
```

Frontend (`frontend/.env` or edit `src/lib/axios.ts`):

```
VITE_API_URL=http://localhost:5000/api
```

### 2) Install & Build

```
cd api && npm i && npm run build
cd ../proxy && npm i && npm run build
cd ../socket && npm i && npm run build
cd ../frontend && pnpm i || npm i && npm run build
```

### 3) Run

In separate terminals:

```
cd api && npm run start
cd proxy && npm run start
cd socket && npm run start
cd frontend && npm run dev
```

---

## Deploying a Project (from the UI)

1. Login/Signup to get a token.
2. Open Deploy page and provide:
   - Repo URL (public read)
   - Project type (react/vite/static)
   - Install commands (e.g., `npm ci`)
   - Build commands (e.g., `npm run build`)
   - Optional build directory (e.g., `frontend`)
3. Watch logs live; once status is `success`, your site is at `https://{slug}.apps.shriii.xyz`.

---

## Notes and Limitations

=

- Queue is in-memory (single instance). Use a persistent queue (e.g., Redis + BullMQ) for HA.
- Single concurrency by default; adjust per environment.
- Docker is required on the API host.
- R2 bucket and credentials must be configured; proxy needs read access via presigned URLs.
