# Netlify Deployment for Astro

This project uses Astro with static output, which works seamlessly on Netlify.

## Why Netlify
- Fast global CDN and automatic HTTPS
- Zero-config static builds (works out of the box with Astro)
- Branch deploys and deploy previews for PRs
- Rollbacks and immutable deploy history
- Redirects/forms/functions if needed later

## Setup
1. Create a Netlify account and connect the GitHub repo.
2. Netlify will detect the framework. If needed, set:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Commit the provided `netlify.toml` in the repo root for consistency.

Note: The current Astro config sets `base: '/web'` and `site` to GitHub Pages. If deploying at Netlify site root, you may want to temporarily remove `base` or set it to `'/'` to avoid prefixed asset paths. Alternatively, deploy to a subpath `/web` on Netlify.

## Branch Deploy Test
1. In Netlify, enable Branch Deploys for a testing branch (e.g., `netlify-test`).
2. Push commits to that branch; Netlify builds and publishes to a unique URL.
3. Verify navigation, assets, and pages load correctly.

## Deploy Main
1. Once branch tests look good, enable build for `main`.
2. Netlify will build on each push to `main` and update the production site.
