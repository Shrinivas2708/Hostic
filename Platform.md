## Hostic Platform — Deep Dive

This document explains what Hostic does under the hood: how deployments are created, built, stored, and served; how logs and statuses flow; and how the UI, API, proxy, and sockets work together.

---

## System Overview

- `frontend/`: React app UX for login, creating deployments, tracking builds, and listing environments.
- `api/`: Express + MongoDB service that manages users, deployments, and builds, runs the build pipeline inside Docker, uploads artifacts to Cloudflare R2, and publishes logs/status to Redis.
- `socket/`: Socket.IO server that relays logs/status from Redis to browsers.
- `proxy/`: Edge-facing Express server that serves each deployment by streaming build output from R2 using presigned URLs, with an SPA fallback and a building page.

Key external dependencies:
- Docker (runtime for isolated builds)
- MongoDB (metadata for users/deployments/builds)
- Redis (pub/sub for logs and statuses)
- Cloudflare R2 (artifact storage; S3-compatible)
- ImageKit (deployment preview images)

---

## Data Model

- `User`
  - `username`, `email`, `password` (plain in this repo; hash in production)
  - `deployments_count` with quota checks on creation

- `Deployments`
  - `slug` (unique), `repo_url`, `branch` (default `main`), `projectType`
  - `installCommands`, `buildCommands`, `buildDir?`
  - `current_build_id`, `buildNo` (limits redeploys)
  - Preview image: `img_url`, `img_id`, `image_build_id`

- `Builds`
  - `build_name` (short id), `status` (queued/building/success/failed)
  - `artifact_path` (R2 prefix), timings

---

## Build Lifecycle

1) A client calls `POST /api/host` with repo and commands. The API:
   - Verifies user quota, creates a `Deployment` (with unique `slug`).
   - Creates an initial `Build` (status `queued`).
   - Enqueues a `BuildJob` in an in-memory queue.

2) The worker (`processJob`):
   - Publishes `building` status via Redis.
   - Creates a clean workspace under `tmp/hostit-builds/<buildId>`.
   - Clones the repo using `simple-git`.
   - Determines project root: prefers user `buildDir`; else searches for nearest `package.json`.
   - Composes a shell pipeline:
     - `[INSTALL] ... && <installCommands> && [BUILD] ... && <buildCommands>`
   - Runs the pipeline inside Docker `node:20` with `-v <projectRoot>:/app -w /app` and the host UID/GID to avoid permissions issues.
   - Streams stdout/stderr via `runStreamingDocker` into `logger`, which publishes to Redis channel `logs:<buildId>`.
   - Detects build artifacts (`dist|build|public|out`) recursively from the workspace root.
   - Uploads the entire artifact directory recursively to R2 under `__output/<slug>/<buildId>/...`.
   - Updates the `Build` to `success` and sets `Deployments.current_build_id`.
   - Publishes `success` status to `status:<buildId>`.
   - Cleans up the workspace directory.

3) Failures:
   - Any error logs to Redis, `Build` becomes `failed`, and `status:<buildId>` publishes `failed`.
   - Workspace is cleaned in `finally`.

Concurrency: `buildQueue.ts` enforces `MAX_CONCURRENT = 1` by default. Scale by increasing concurrency and/or moving to a distributed queue (BullMQ / Redis streams) for multi-instance workers.

---

## Serving Architecture (Proxy)

- Hostnames: `https://{slug}.apps.shriii.xyz`.
- Proxy extracts `slug` from the `Host` header and loads the corresponding `Deployment` then `Build`.
- If the build is `queued` or `building`, serves a static "building" page.
- If the latest build is `success`, constructs a file key as `<artifact_path><requested_path>` and fetches it from R2 via a presigned URL, streaming the response to the client. If the incoming path has no extension, SPA fallback to `/index.html`.
- Sets content headers and simple cache headers for efficiency.

---

## Realtime Logs & Status

- The API publishes lines to `logs:<buildId>` and status changes to `status:<buildId>` via Redis.
- The Socket server subscribes per-connection to both channels and immediately emits events to the browser.
- The UI shows a live scroll of logs and a status badge; on `success`, it reveals the deployment URL.

Events:
- `log` — a single line with timestamp prefix
- `status` — one of `queued | building | failed | success`

---

## Security Notes & Production Hardening

- Use hashed passwords (bcrypt/argon2) and transport TLS.
- Persist the queue and run multiple workers to avoid losing jobs on restarts.
- Add timeouts and resource limits to Docker runs; consider per-build CPU/memory quotas.
- Validate `repo_url` and sanitize shell commands; consider allowlists and templated builders per framework.
- Enforce per-user quotas (CPU, builds/day, bandwidth) and rate limiting on the API.
- Add private repo support via deploy keys or GitHub App.
- Move image previews to a background job with retries.

---

## Environment Variables

API:
- `PORT`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`
- `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`

Proxy:
- `PORT`, `DATABASE_URL`
- `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`

Socket:
- `REDIS_URL`

Frontend:
- `VITE_API_URL` or configure `src/lib/axios.ts`

---

## Operational Runbooks

- Scale builds: increase `MAX_CONCURRENT`, or move to a distributed queue; shard by user/team if needed.
- Cleanup: builds are ephemeral; workspaces are removed automatically. Enforce R2 lifecycle rules to reclaim storage for old builds.
- Observability: ship build logs to an external sink in addition to Redis (e.g., Loki/ELK). Add metrics on build duration, failure rates, artifact sizes.
- Disaster recovery: MongoDB backups; infra as code for Redis/R2; environment secrets rotation.

---

## Roadmap Ideas

- Git provider webhooks to auto-redeploy on push.
- Framework presets and autodetection with zero-config builders.
- Custom domains and SSL certificates via DNS automation.
- Team/org model with roles and per-project permissions.
- Canary deploys, rollbacks, and build promotion.


