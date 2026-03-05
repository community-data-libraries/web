# Flowbite Evaluation & Data Preview Page

Status (March 2026): Flowbite is intentionally removed from this project. The site now uses native theme tokens and custom blocks.

Flowbite (Tailwind component library) can improve UI patterns, but it requires Tailwind CSS.

## Integration Steps (Plan)
1. Install Tailwind in Astro: `npm i -D tailwindcss postcss autoprefixer` and init config.
2. Configure Astro to include Tailwind (`src/styles/tailwind.css`, add to `Layout.astro`).
3. Install Flowbite: `npm i flowbite` and include plugin in Tailwind config.
4. Use Flowbite components on the data preview page (cards, tables, tabs).

## Current Starter
A basic `data-preview` page is added without Tailwind/Flowbite to validate structure. After Tailwind is in place, swap markup for Flowbite components.

## Current Investigation Status

Flowbite is still not fully validated in this codebase and needs deeper troubleshooting before committing to it.

### Troubleshooting Checklist
1. Confirm Tailwind setup version and plugin compatibility (`tailwindcss` + Flowbite plugin).
2. Validate PostCSS config against Tailwind version in this repo.
3. Run a minimal Flowbite component smoke test on one page.
4. Verify generated CSS includes Flowbite utilities/components.
5. Decide: keep Flowbite or remove dependency and continue with native project styles.

## Decision Gate

Only after Flowbite is confirmed (or intentionally dropped), continue with:

- `data-preview` page design decisions
- Datasheet structure and UX implementation

This avoids rework while UI foundation is still uncertain.
