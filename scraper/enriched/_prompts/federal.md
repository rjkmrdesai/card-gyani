You are stage 4 (enrichment) of the Card Gyani scraper for ONE bank: Federal Bank (id: federal).

INPUTS:
  - Parsed cards (names to match against): /Users/rajkumar/Desktop/Card Gyani/cardgyani-site/scraper/parsed/federal.json
  - Candidate product listing URL: https://www.federalbank.co.in/credit-card
  - Per-bank notes: HTML landing page. It may link out to per-card MITC PDFs rather than holding the data inline - if so, follow those links and add them as child sources.
You have WebFetch and WebSearch — USE THEM. This stage must NOT rely on memory.

STEPS:
  1. Verify the listing URL resolves (WebFetch it). If it 404s / is wrong, WebSearch
     for the bank's official live credit-cards page and use that. Record which.
  2. Scrape the listing page (and key per-card product pages) to collect, per card:
     rewards summary, lounge access, welcome benefit, network (Visa/Mastercard/
     RuPay/Amex/Diners), a real apply/product URL on the bank's domain, and a short
     badge highlight. Infer category as one of: super_premium | premium | mid_tier | entry.
  3. For EVERY card in the parsed file, match by normalized name (lowercase, strip
     issuer words like "SBI Card"/"HDFC Bank"/"Credit Card"). Fill enrichment ONLY
     from what you actually found on the bank's pages.

OUTPUT — write this JSON to /Users/rajkumar/Desktop/Card Gyani/cardgyani-site/scraper/enriched/federal.json:
{
  "id": "federal", "bank": "Federal Bank",
  "product_listing_url": "<the URL you actually used>",
  "listing_url_status": "ok" | "replaced" | "unresolved",
  "cards": [
    {
      "name": "<EXACT name from the parsed file>",   // so merge can join
      "match_status": "matched" | "low_confidence" | "unmatched",
      "network": <str|null>, "category": <"super_premium"|"premium"|"mid_tier"|"entry"|null>,
      "rewards": <str|null>, "lounge": <str|null>, "welcome_benefit": <str|null>,
      "badge": <str|null>, "apply_url": <str|null>,
      "enrich_source": <url string you took the data from | null>
    }
  ]
}

HARD RULES:
  - NEVER fill rewards/lounge/welcome/network/badge from memory. Only from fetched
    bank pages. If you didn't find it on a page, the field is null.
  - apply_url MUST be a real URL you fetched/verified on the bank's own domain, else null.
  - If a parsed card can't be confidently matched to a product page, set match_status
    "unmatched" and leave ALL enrichment fields null. Include it anyway (every parsed
    card must appear) so stage 5 can merge.
  - category is your classification from the card's positioning/fee tier (4 buckets only).
  - Output STRICT JSON only, then return a one-line summary.

Return ONLY: "federal: <matched>/<total> matched, listing <ok|replaced|unresolved>" + caveats.
Do NOT paste the JSON back.
