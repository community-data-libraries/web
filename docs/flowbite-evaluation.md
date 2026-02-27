# Flowbite Evaluation & Data Preview Page

Flowbite (Tailwind component library) can improve UI patterns, but it requires Tailwind CSS.

## Integration Steps (Plan)
1. Install Tailwind in Astro: `npm i -D tailwindcss postcss autoprefixer` and init config.
2. Configure Astro to include Tailwind (`src/styles/tailwind.css`, add to `Layout.astro`).
3. Install Flowbite: `npm i flowbite` and include plugin in Tailwind config.
4. Use Flowbite components on the data preview page (cards, tables, tabs).

## Current Starter
A basic `data-preview` page is added without Tailwind/Flowbite to validate structure. After Tailwind is in place, swap markup for Flowbite components.
