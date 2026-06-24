# Ngrok setup (API + proxy)

Expose your **local API** and **local proxy** with one ngrok agent.  
Free ngrok gives you two random URLs — good enough to test publicly.

---

## 1. Install ngrok

https://ngrok.com/download

```powershell
ngrok version
```

Sign up, copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

---

## 2. Configure

Run once (saves to your user config, not this repo):

```powershell
ngrok config add-authtoken YOUR_TOKEN
```

Get your token: https://dashboard.ngrok.com/get-started/your-authtoken

The repo `ngrok.yml` only defines tunnels — **no authtoken here** (avoids overriding your global config).

---

## 3. Start your stack

**Terminal 1 — API**
```powershell
cd api
npm run dev
```

**Terminal 2 — Proxy** (ngrok path mode)
```powershell
cd proxy
# proxy/.env must have:
# APPS_DOMAIN=path
npm run dev
```

**Terminal 3 — Frontend**
```powershell
cd frontend
npm run dev
```

**Terminal 4 — Ngrok (both tunnels)**
```powershell
cd C:\Users\ssher\OneDrive\Desktop\Hostic
ngrok start --all --config "$env:LOCALAPPDATA\ngrok\ngrok.yml,ngrok.yml"
```

Uses your **global** authtoken (from `ngrok config add-authtoken`) plus tunnel definitions from this repo.

Ngrok UI: http://127.0.0.1:4040 — copy the two **Forwarding** URLs:

| Tunnel        | Local   | Example ngrok URL                    |
|---------------|---------|--------------------------------------|
| `hostic-api`  | :5000   | `https://abc123.ngrok-free.app`      |
| `hostic-proxy`| :8080   | `https://def456.ngrok-free.app`      |

---

## 4. Update env files

Replace `abc123` / `def456` with **your** URLs (no trailing slash).

### `api/.env`

```env
API_PUBLIC_URL=https://abc123.ngrok-free.app
GITHUB_CALLBACK_URL=https://abc123.ngrok-free.app/api/github/callback
FRONTEND_URL=http://localhost:5173
DEPLOY_URL_TEMPLATE=https://def456.ngrok-free.app/d/{slug}
```

Restart API after editing.

### `proxy/.env`

```env
APPS_DOMAIN=path
```

### `frontend/.env`

```env
VITE_API_URL=https://abc123.ngrok-free.app/api
VITE_DEPLOY_URL_TEMPLATE=https://def456.ngrok-free.app/d/{slug}
```

Restart frontend (`npm run dev`).

### GitHub OAuth app

Callback URL must match:

```
https://abc123.ngrok-free.app/api/github/callback
```

---

## 5. Deploy and open your site

1. Deploy from dashboard or `hostic deploy`
2. When build succeeds, your app URL is:

```
https://def456.ngrok-free.app/d/your-slug/
```

Example: slug `startup` → `https://def456.ngrok-free.app/d/startup/`

---

## CLI

```powershell
hostic login --api-url https://abc123.ngrok-free.app/api `
  --deploy-url https://def456.ngrok-free.app/d/{slug}

hostic deploy --slug my-app
```

---

## Notes

- **Ngrok URLs change** every time you restart ngrok (free tier). Update `.env` files each time.
- **Path mode** (`/d/{slug}/`) is required on free ngrok — no wildcard subdomains.
- For permanent `https://{slug}.apps.shribuilds.in`, use Cloudflare Tunnel or a VPS (see `ARCHITECTURE.md`).
- If ngrok shows a browser warning page, click through once or add header `ngrok-skip-browser-warning: true` in API clients.

---

## Quick checklist

- [ ] `ngrok.yml` authtoken set  
- [ ] `ngrok start --all` running  
- [ ] API on :5000, proxy on :8080  
- [ ] `proxy/.env` → `APPS_DOMAIN=path`  
- [ ] `api/.env` + `frontend/.env` updated with ngrok URLs  
- [ ] API + frontend restarted  
