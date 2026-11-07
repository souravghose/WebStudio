# Deploying WebStudio

WebStudio is a **static site**: `npm run build` produces a `dist/` folder of plain HTML/JS/CSS that any static host can serve. There is no server to run and no environment variables to set. Assets use relative paths, so the same build works at a domain root or under a sub-path such as `https://you.github.io/webstudio/`.

Before deploying, make sure it builds locally:

```bash
npm install
npm run build
npm run preview     # open the printed URL and click around
```

## 1. Put the code on GitHub

```bash
cd webstudio
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/webstudio.git
git push -u origin main
```

Create the empty repository on github.com first (no README/licence, so the push is clean). `node_modules/` and `dist/` are already git-ignored; keep `package-lock.json` committed.

## 2. Pick a host

### Option A — GitHub Pages (free, workflow included)

1. Push to `main` (step 1). The workflow in `.github/workflows/deploy.yml` is already in the repo.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open the **Actions** tab; the "Deploy to GitHub Pages" run builds and publishes. When it is green your site is at `https://<your-username>.github.io/<repo-name>/`.

Every later push to `main` redeploys automatically. Note: GitHub Pages on a free account requires a **public** repository.

### Option B — Netlify (free tier)

- **From Git:** *Add new site → Import an existing project →* pick the repo. Netlify reads `netlify.toml` (build `npm run build`, publish `dist`). Click **Deploy**.
- **No Git:** run `npm run build`, then drag the `dist/` folder onto <https://app.netlify.com/drop>.

### Option C — Vercel (free hobby tier)

*Add New → Project →* import the repo. Vercel detects Vite automatically (`vercel.json` is included). Click **Deploy**.

### Option D — Cloudflare Pages (free)

*Workers & Pages → Create → Pages → Connect to Git →* choose the repo.
Build command `npm run build`, output directory `dist`, and add the environment variable `NODE_VERSION=22`.

### Option E — Your own server / VPS (Docker)

```bash
docker build -t webstudio .
docker run -d -p 80:80 --restart unless-stopped --name webstudio webstudio
```

Put it behind HTTPS (e.g. Caddy, or nginx + Let's Encrypt/Certbot). Without Docker: build locally and copy `dist/` to any web root; `deploy/nginx.conf` shows a suitable nginx config.

## 3. Custom domain (optional)

Add the domain in your host's dashboard (GitHub: *Settings → Pages → Custom domain*; Netlify/Vercel/Cloudflare: *Domains*), then create the DNS record the host shows you — usually a `CNAME` for `www`/subdomains and `A`/`ALIAS` records for the apex domain. HTTPS certificates are issued automatically (allow a few minutes to a few hours for DNS).

## 4. After deploying — quick checklist

- [ ] The editor loads and the default project's preview renders.
- [ ] Type in the editor → the preview updates.
- [ ] Reload the page → your project is still there (IndexedDB).
- [ ] Export a ZIP and re-import it.
- [ ] Open the site on your phone.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank page on GitHub Pages | Pages source must be **GitHub Actions** (not "Deploy from a branch"), and the workflow run must have succeeded. |
| Workflow fails at `npm ci` | Commit `package-lock.json`, and keep Node ≥ 20.19 (the workflow uses 22). |
| Editor stays on "Loading…" | Open the browser console. Usually a blocked `.js` worker request — host must serve files with correct MIME types (all hosts above do). |
| Projects disappeared | They live in that browser's IndexedDB under that exact origin. Different domain, private window or cleared site data = empty. Export ZIPs as backups. |
| Updates not showing after redeploy | Hard-refresh (`Ctrl+Shift+R`). Asset filenames are content-hashed, so only `index.html` is ever stale. |
