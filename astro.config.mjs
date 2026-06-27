import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the real production domain — it drives the sitemap, canonical
// tags and Open Graph URLs across every page.
export default defineConfig({
  site: 'https://cardgyani.com',
  output: 'static',
  integrations: [sitemap()],
  build: {
    // Inline all page CSS into <style> tags instead of emitting a
    // render-blocking <link rel="stylesheet">. For an SSG site with a 10ms
    // TTFB the ~40 KB of CSS (≈8 KB gzip) travels with the HTML response,
    // so first paint is no longer gated on a separate CSS round-trip.
    inlineStylesheets: 'always',
  },
});
