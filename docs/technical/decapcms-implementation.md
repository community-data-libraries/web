# DecapCMS Implementation Plan

This project now includes a DecapCMS starter at `public/admin` for Netlify deployment.

## Why this setup

Based on DecapCMS docs, the minimum static-site integration is:
- `admin/index.html` loading DecapCMS from CDN
- `admin/config.yml` defining backend and content collections

DecapCMS works with or without Netlify, but on Netlify the typical path is `git-gateway` + Netlify Identity for authentication.

## What is added

- `public/admin/index.html`
- `public/admin/config.yml`
- `local_backend: true` enabled for local editing workflow

## Netlify steps

1. In Netlify site settings, enable **Identity**.
2. Under Identity, enable **Git Gateway**.
3. Invite content editors (or enable registration based on policy).
4. Deploy and open `/web/admin/`.

## Local editing flow

1. Start Astro dev server.
2. In a second terminal, run:
   - `npx decap-server`
3. Open `http://localhost:4321/web/admin/`.

`local_backend` is for local development only.

## Notes for this repo

- Content maps to `src/content/complete-catalog`.
- New metadata fields are included for role-aware views:
  - `dataThemes`
  - `pedagogicalTags`
  - `audienceAccess`
  - `sensitive`
- Teacher view can include pedagogical tags; student/community views are theme-only and filtered.

## Community Library Provisioning via Decap

This repo now includes a second Decap collection:
- `community-library-requests` in `src/content/community-library-requests`

Provisioning flow:
1. Create a request entry in Decap with geographic filter booleans.
2. Keep status as `pending` during review.
3. Change status to `approved` when ready to provision.
4. GitHub Action `community-library-instantiation.yml` runs automation.
5. Automation creates a new repo from the template and writes `config/community.yml`.
6. Request entry is updated to `provisioned` (or `failed` with `last_error`).

See `docs/technical/community-library-instantiation.md` for required secrets and environment configuration.
