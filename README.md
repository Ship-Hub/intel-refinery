# Intel Refinery

Intel Refinery transforms scattered sources into structured understanding: traceable findings, source-backed reports, knowledge graphs, and reusable models.

## Structure

- `frontend`: Vite/React landing page and workspace app.
- `api`: Express API.
- `tg-bot`: local copy of the Telegram bot, deployed from `Ship-Hub/intel-refinery-bot`.

Production hosts:

- Landing page: `https://intelrefinery.site`
- App: `https://app.intelrefinery.site`
- API: `https://api.intelrefinery.site`

## Commands

```bash
npm install
npm run build
npm test
```

The frontend production build uses `frontend/.env.production`, which points at `https://api.intelrefinery.site`.
