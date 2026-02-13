import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

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
  
  // Enable content collections
  // Content collections provide type-safe content management
  experimental: {},
  
  // Vite configuration for development
  vite: {
    // Path aliases are configured in tsconfig.json
    ssr: {
      // Externalize dependencies that should not be bundled
      noExternal: [],
    },
  },
});
