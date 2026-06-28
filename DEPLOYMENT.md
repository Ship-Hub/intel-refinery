# Production Deployment Notes

Target server: Contabo origin `167.86.85.230`, fronted by Cloudflare DNS for `intelrefinery.site`.

Expected production shape:

- `intelrefinery.site`: serve `frontend/dist` as the public landing page.
- `app.intelrefinery.site`: serve the same `frontend/dist`; the React app detects the `app.` hostname and renders workspace routes.
- `api.intelrefinery.site`: reverse proxy to the Express API process.

Recommended process names:

- `intel-refinery-api`: `node server.js` from `api`.
- `intel-refinery-worker`: `node worker.js` from `api` if background workers are enabled.

Required API environment highlights:

```bash
NODE_ENV=production
PORT=5000
FRONTEND_BASE_URL=https://app.intelrefinery.site
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=intel_refinery
GOOGLE_CLIENT_ID=968043286718-ekoju703u0ekiqoelvpfkg4knfi4llbo.apps.googleusercontent.com
```

Current blocker: SSH to the Contabo IP times out from this workstation on ports `22` and `2222`, although HTTP and HTTPS are reachable.
