# Backend (Starter)

This folder contains a minimal Node.js backend that reads YAML source files and exposes them through a tiny API.

## Endpoints

- `GET /api/health` - health check
- `GET /api/sources` - list all sources
- `GET /api/sources/:id` - get one source by `id`

## Local run

From the project root:

1. Install dependencies: `npm install`
2. Start backend: `npm run backend:dev`

The backend server runs on `http://localhost:4322` by default.
Set `BACKEND_PORT` to override.

## Data location

YAML files are loaded from:

- `backend/data/sources/*.yml`
