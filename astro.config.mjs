import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const BACKEND_DEV_URL = process.env.BACKEND_DEV_URL ?? 'http://localhost:4323';

// https://astro.build/config
export default defineConfig({
  // Enable React integration for interactive components
  integrations: [react()],

  // Configure for static site generation (SSG)
  // All pages are pre-rendered at build time
  // This allows deployment to any static hosting (GitHub Pages, Netlify, Vercel, etc.)
  output: 'static',

  // Site configuration for SEO and deployment
  site: 'https://community-data-libraries.github.io',
  base: '/web',

  // Keep Astro on 4321 so the preview API can use 4323 (Astro falls back to 4322 when 4321 is busy).
  server: {
    port: 4321,
  },

  // Enable content collections
  // Content collections provide type-safe content management
  experimental: {},

  // Vite configuration for development
  vite: {
    server: {
      proxy: {
        '/api/sources': { target: BACKEND_DEV_URL, changeOrigin: true },
        '/api/health': { target: BACKEND_DEV_URL, changeOrigin: true },
      },
    },
    // Path aliases for cleaner imports (mirror tsconfig paths)
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@content': '/src/content',
        '@lib': '/src/lib',
        '@data': '/src/data',
      },
    },
    ssr: {
      // Externalize dependencies that should not be bundled
      noExternal: [],
    },
  },
});
