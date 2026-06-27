import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the real production domain — it drives the sitemap, canonical
// tags and Open Graph URLs across every page.
export default defineConfig({
  site: 'https://cardgyani.com',
  output: 'static',
  integrations: [sitemap()],
});
