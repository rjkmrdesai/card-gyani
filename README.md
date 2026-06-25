# Card Gyani — production site

Static **Astro** site that reproduces the `cardgyani.html` prototype (same green/black
branding, logo, homepage search + category pills, list/filter, detail pages and
side‑by‑side compare) with three production changes:

1. **Card data comes from Supabase** (`cards` table), read **at build time** — not hardcoded.
2. **Every card and every category has its own real URL** for SEO.
3. **“Apply Now” is an external link** to each card's `apply_url`, opening the bank's
   site in a new tab (`target="_blank" rel="noopener noreferrer nofollow"`).

## URLs

| Route | Page |
|---|---|
| `/` | Homepage (hero, search, category pills, card grid) |
| `/cards/` | All cards — sidebar filters, sort, compare |
| `/cards/<slug>/` | Card detail (one per card, e.g. `/cards/hdfc-infinia-metal-edition/`) |
| `/cards/category/<category>/` | Category landing (e.g. `/cards/category/super-premium/`) |
| `/compare/` | Side‑by‑side compare (reads selection from the visitor's browser) |
| `/sitemap-index.xml`, `/robots.txt` | SEO |

## Data flow

- `src/data/cards.js` reads the Supabase `cards` + `banks` tables with the **anon key**
  (RLS allows read‑only) and maps each DB row into the render shape. It's memoized, so the
  whole build does **one** round‑trip.
- `src/lib/core.js` is the single, framework‑agnostic render source used by **both** the
  Astro build (SEO HTML) and the browser (`src/lib/client.js`) — so the static markup and
  the interactive markup can't drift.
- Interactivity (filter, sort, search, language EN/HI/TA/TE, compare) runs client‑side.
  Compare selection + language preference persist in `localStorage`. Cross‑page navigation
  uses real links.

## Supabase

The `cards` table is the real HDFC MITC catalog (10 cards) extended with the columns the
site needs: `slug`, `card_type`, `badge`, `reward_rate`, `late_payment_fee`,
`benefits[]`, `features[]`, and **`apply_url`**. Edit any of these in Supabase and rebuild
to publish.

> The `apply_url` values are best‑effort HDFC product‑page URLs — review them in the table
> before going live.

Config lives in `.env` (gitignored):

```
PUBLIC_SUPABASE_URL=https://ugpubzjcrhwlwgkfxgup.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Develop / build

```bash
npm install
npm run dev       # local dev
npm run build     # static output -> dist/
npm run preview   # serve the built site
```

Set your real domain in `astro.config.mjs` (`site:`) and `public/robots.txt` before deploy.
Because everything is read at build time, **re‑run the build whenever the Supabase data
changes** (e.g. via a deploy hook). Deploy `dist/` to any static host (Netlify, Vercel,
Cloudflare Pages, S3, …).
