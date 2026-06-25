import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change `site` to your real production domain — it drives the sitemap + canonical URLs.
export default defineConfig({
  site: 'https://cardgyani.example.com',
  output: 'static',
  integrations: [sitemap()],
});
