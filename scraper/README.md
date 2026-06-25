# Card Gyani — MITC Scraper Spec

This folder holds the pipeline that populates the Supabase `cards` table from each issuer's
**MITC** (Most Important Terms & Conditions) document, plus a light enrichment pass for the
data MITCs don't contain (rewards, lounge, benefits).

> **Read this before writing code.** This is a spec, not the implementation. Build to it.

---

## 0. Golden rules (do not skip)

1. **Accuracy over coverage.** This is financial data people make decisions on. If a value is
   ambiguous or not clearly stated, write `null` and set `data_status = "needs_review"`.
   **Never guess a fee or fill from memory.**
2. **Provenance on every card.** Every row must carry `source_url`, `source_section`, and
   `mitc_last_checked` so any number can be traced back to the document it came from.
3. **Be a polite scraper.** Respect each site's `robots.txt`, send a descriptive User-Agent,
   space out requests (≥2s between hits to the same host), and **cache** downloads locally so
   re-runs don't re-hit the banks. Store the extracted **data** (facts/fees), not redistributed
   copies of the PDFs.
4. **Human gate before publish.** The pipeline ends by writing a review file. A person spot-checks
   a sample against the source docs **before** anything loads into Supabase.

---

## 1. Pipeline stages

```
sources.json
   │
   ▼
[1] fetch      download each MITC (PDF or HTML) → scraper/sources/<id>.{pdf,html}   (cached)
   ▼
[2] extract    PDF → text + tables (pdfplumber/pymupdf); HTML → parsed tables.
               AUTO-DETECT scanned PDFs: if extracted text is near-empty, OCR (tesseract).
               → scraper/extracted/<id>.txt  (+ <id>.tables.json)
   ▼
[3] parse      LLM reads extracted text → structured JSON per bank:
                 - cards[]        (per-card: name, annual_fee, renewal_fee, fee_waiver)
                 - bank_defaults  (forex, finance %, cash advance, late-fee tiers, free days)
               → scraper/parsed/<id>.json
   ▼
[4] enrich     scrape each bank's product/listing pages → add rewards, lounge, welcome benefit,
               network, category, apply_url, badge — matched to cards by name.
               → scraper/enriched/<id>.json
   ▼
[5] merge      flatten to final rows: per-card fees + bank_defaults (with per-card overrides),
               dedupe, validate, assign data_status.
               → scraper/out/cards.json   +   scraper/out/review.csv
   ▼
[6] verify     HUMAN spot-checks scraper/out/review.csv against source docs.
   ▼
[7] load       upsert verified rows into Supabase `cards` (keyed on a stable card_id).
```

Use the LLM (you, Claude Code) for stage **[3]** — bank PDFs have wildly different layouts and
rule-based parsing is brittle. Give the model the extracted text and have it return strict JSON.

---

## 2. Folder layout

```
scraper/
  README.md            ← this file
  sources.json         ← input manifest (one entry per bank)
  fetch.*              ← stage 1
  extract.*            ← stage 2
  parse.*              ← stage 3 (calls the LLM)
  enrich.*             ← stage 4
  merge.*              ← stage 5
  load.*               ← stage 7 (Supabase upsert)
  refresh.*            ← monthly re-fetch + diff (see §6)
  sources/             ← cached raw downloads        (gitignore)
  extracted/           ← extracted text + tables     (gitignore)
  parsed/              ← per-bank parsed JSON
  enriched/            ← per-bank enriched JSON
  out/
    cards.json         ← final merged rows
    review.csv         ← human-review sheet
    bank_defaults.json ← reference: each bank's portfolio-wide terms
```

Language: Python is recommended (pdfplumber/pymupdf, ocrmypdf/pytesseract, requests/httpx,
beautifulsoup4). Node is fine if you prefer — keep it consistent.

---

## 3. `sources.json` schema

Each bank entry:

| field | meaning |
|---|---|
| `id` | short slug, used in filenames and as the bank key |
| `bank` | display name (must match the Supabase `bank` column values) |
| `mitc_url` | the document to download |
| `format` | `"pdf"` or `"html"` — tells the fetcher how to handle it |
| `likely_scanned` | hint only; **always auto-detect** and OCR when text is sparse |
| `card_coverage` | `fee_table_all` \| `segment` \| `single_or_generic` — sets expectations |
| `product_listing_url` | best-effort starting point for enrichment — **verify it resolves** |
| `notes` | per-bank quirks (query-string URLs, encoding, scanned, secured-only, etc.) |

---

## 4. Output data model

### 4a. Final card row (must match the Supabase `cards` table)

```jsonc
{
  "card_id": "hdfc-millennia",          // stable slug: <bankid>-<kebab-name>; used as upsert key
  "bank": "HDFC",
  "name": "Millennia",
  "network": "Visa / Mastercard",       // null if not stated
  "category": "entry",                  // super_premium | premium | mid_tier | entry (from enrichment)
  "type": "retail",                     // retail | cobrand | business | secured(=FD-linked)
  "annual_fee": 1000,                   // INR integer; from MITC
  "joining_fee": 1000,                  // INR integer; from MITC (null if not separately stated)
  "fee_waiver": "Waived on annual spends of Rs.1 lakh",   // text/condition from MITC; null if none
  "forex": 3.5,                         // % markup; bank default unless MITC names an exception
  "finance_pm": 3.75,                   // % per month; effective for this card (unsecured vs secured)
  "finance_pa": 45.0,                   // % per annum
  "cash_advance": "2.5%, min Rs.500",   // text from MITC
  "late_fee": "Tiered: Nil <=Rs.500 ... Rs.1300 >Rs.50,000",  // text/tiers from MITC
  "rewards": "5% cashback on Amazon, Flipkart...",   // ENRICHMENT (not in MITC)
  "lounge": "8 domestic/yr via Dreamfolks",          // ENRICHMENT
  "features": ["...", "..."],                        // ENRICHMENT bullet list
  "badge": "5% cashback",                            // short highlight chip (ENRICHMENT)
  "apply_url": "https://www.hdfcbank.com/.../millennia",   // ENRICHMENT (bank apply page)

  // provenance / QA (see §4b — may need a Supabase migration to add)
  "source_url": "https://www.hdfc.bank.in/.../mitc-in-english.pdf",
  "source_section": "Schedule of Fees, p.12 / 'Millennia' row",
  "mitc_last_checked": "2026-06-25",
  "data_status": "needs_review"         // verified | needs_review | unverified
}
```

### 4b. Provenance columns (add to Supabase if missing)

If the `cards` table doesn't already have these, create a migration to add them:
`source_url text`, `source_section text`, `mitc_last_checked date`,
`data_status text default 'needs_review'`. The public site can ignore these columns; they exist
for traceability and the "verify on bank site" footer/date.

### 4c. Bank-wide defaults vs per-card overrides

Most charge fields (forex, finance %, cash advance, late-fee tiers) are stated **once per bank**
and apply to the whole portfolio, with a few **named exceptions**. So:

1. Parse a `bank_defaults` block per bank (stage 3) → `out/bank_defaults.json`.
2. At merge (stage 5), stamp those defaults onto every card from that bank.
3. Where the MITC names a card-specific exception (e.g. "forex 1.99% for Card X", or
   "2.75%/mo for secured cards"), override just that card.

Example `bank_defaults` entry:
```jsonc
{
  "sbi": {
    "forex_default": 3.5,
    "forex_exceptions": { "AURUM": 1.99, "SBI Card ELITE": 1.99, "SBI Card MILES": 3.0 },
    "finance_pm_unsecured": 3.75, "finance_pa_unsecured": 45.0,
    "finance_pm_secured": 2.75,   "finance_pa_secured": 33.0,
    "cash_advance": "2.5%, min Rs.500",
    "late_fee_tiers": "Nil <=Rs.100; Rs.100 (101-500); Rs.500 (501-1,000); Rs.750 (1,001-10,000); Rs.950 (10,001-25,000); Rs.1,100 (25,001-50,000); Rs.1,300 (>50,000)",
    "interest_free_days": "20-50"
  }
}
```

---

## 5. Stage details & gotchas

- **[1] fetch:** follow redirects; URL-encode `&` and spaces (YES Bank `?name=`, SBM `T&C`,
  RBL `%20`). Set a User-Agent like `CardGyaniBot/1.0 (+https://cardgyani.com)`. Save every raw
  file under `sources/` and **skip re-download if already cached** (use an `--refresh` flag to force).
- **[2] extract:** try text extraction first; if a page yields < ~50 chars, treat the doc as
  scanned and OCR it. Keep table structure where possible (`pdfplumber.extract_tables`). For HTML
  (SBI, Federal), parse the fee `<table>` directly — far cleaner than PDF.
- **[3] parse:** prompt the model to return **strict JSON only**, with `null` for anything not
  clearly stated, and to copy the exact `source_section` (page/heading/row) for each card. Do one
  bank per call to keep context tight. Never let it invent cards or fees.
- **[4] enrich:** verify `product_listing_url` resolves first; if 404, search for the bank's
  current credit-cards page. Match enrichment to MITC cards by normalized name (lowercase, strip
  "SBI Card"/"HDFC Bank" suffixes). If a card can't be confidently matched, **leave enrichment
  fields null and flag it** rather than guessing.
- **[5] merge:** dedupe by `card_id`; drop obvious non-cards (add-on fees, generic rows). Set
  `data_status = "verified"` only after stage 6 — the scraper itself writes `needs_review`.
- **[7] load:** **upsert** on `card_id` so re-runs update rather than duplicate. Do not delete
  cards that disappear from a re-run automatically — flag them for review instead.

---

## 6. Keeping it current (`refresh`)

MITCs change every few months. Build a `refresh` script that re-fetches all sources, re-parses,
and **diffs** against what's in Supabase. It must **not** silently overwrite — instead write a
`out/changes.csv` listing every changed field (old → new, with source) for human approval.
Run it monthly (or on demand).

---

## 7. Legal / ethical note

MITCs are public, RBI-mandated disclosures and the fee figures are facts (not copyrightable), so
extracting them is fine. Stay clean: obey `robots.txt`, rate-limit, cache, identify your bot, and
store the extracted data rather than rehosting the source PDFs. Always keep the site's "indicative
figures from issuer MITC — verify on the bank site" note and show `mitc_last_checked`.

---

## 8. Expected yield

- **Comes out clean & automated:** card names, annual/renewal fees, waiver conditions, and the
  bank-wide charge terms (forex, finance %, cash advance, late fees). SBI alone has ~90 cards in
  one HTML table; across all 13 issuers expect a few hundred cards.
- **Needs review time:** the old/scanned IndusInd doc, any card-name matching during enrichment,
  and the rewards/lounge/benefit fields (which are scraped from product pages, not the MITC).
