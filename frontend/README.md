# Hostic Frontend

React dashboard for the Hostic deployment platform.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4
- Zustand (auth, deploy, GitHub, toast state)
- React Router
- Socket.IO client (connects to API port, not a separate socket service)
- HeroUI components

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing / marketing |
| `/login`, `/signup` | JWT auth |
| `/deploy` | GitHub repo picker, autodetected install/build commands |
| `/deployments` | Deployment list with preview thumbnails |
| `/deployments/:id/:buildName` | Live build logs (Socket.IO) |
| `/deployed/:id/:buildName` | Success view with live URL |

## Config (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api
VITE_DEPLOY_URL_TEMPLATE=http://{slug}.localhost:8080
# VITE_SOCKET_URL optional — defaults to API origin without /api
```

See `src/lib/config.ts` for URL helpers (`getDeploymentUrl`, socket URL derivation).

## Development

```bash
npm install
npm run dev   # http://localhost:5173
```

Requires the API running on port 5000.

## Key files

- `src/store/authStore.ts` — JWT token and user
- `src/store/deployStore.ts` — deployment API calls
- `src/store/githubStore.ts` — GitHub OAuth and repo listing
- `src/pages/Deploy.tsx` — deploy form with package.json autodetection
- `src/pages/BuildPage.tsx` — live logs via Socket.IO
