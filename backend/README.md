# Backend (mirror)

This folder mirrors the canonical backend repo for local API development.

## Source of truth

Canonical YAML lives in the sibling **`../backend`** repository (`backend/data/sources/`).
Do not edit files here directly — changes will be overwritten on the next sync.

From the web repo root:

```bash
npm run sync:backend-yaml    # copy ../backend/data/sources → backend/data/sources
npm run check:backend-yaml   # verify mirror matches canonical backend
```

Set `BACKEND_ROOT` or `BACKEND_SOURCES_DIR` in `.env` if the backend repo is elsewhere.

## SQLite

After importing in the canonical backend:

```bash
npm run backend:import       # runs import + copies database/sources.db here
```

## API

```bash
npm run backend:dev          # http://localhost:4323
```

Endpoints include `/api/sources`, `/api/sources/:id/preview`, `/api/sources/:id/chart`, and `/api/sources/:id/datasheet`.

## Pipeline (canonical backend)

```bash
npm run backend:pipeline     # variable extraction + SQLite import + mirror
```

Requires Python venv in canonical backend with pandas:

```bash
cd ../backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Preview/chart/filter API routes use **pandas** when available (`previewEngine: "pandas"` on `/api/health`).
Set `PREVIEW_ENGINE=node` to force the legacy Node CSV parser.
