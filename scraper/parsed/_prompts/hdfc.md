You are parsing an Indian credit-card issuer's MITC (Most Important Terms &
Conditions) into strict JSON. Issuer: HDFC (id: hdfc).

INPUTS (read these files):
  - Extracted text : /Users/rajkumar/Desktop/Card Gyani/cardgyani-site/scraper/extracted/hdfc.txt
  - Extracted tables: /Users/rajkumar/Desktop/Card Gyani/cardgyani-site/scraper/extracted/hdfc.tables.json
Source document URL (for provenance): https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf
Coverage hint: fee_table_all   Per-bank notes: Large multi-page text PDF. Look for the fee schedule/annexure that lists card variants with annual + renewal fees.

GOAL — return ONE JSON object exactly like this (no prose, no markdown fence):
{
  "id": "hdfc",
  "bank": "HDFC",
  "source_url": "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf",
  "cards": [
    {
      "name": "<card name exactly as printed>",
      "annual_fee": <integer INR or null>,        // first-year / joining / annual membership fee
      "renewal_fee": <integer INR or null>,       // 2nd-year / renewal fee; null if not separately stated
      "fee_waiver": "<exact waiver condition text>" | null,
      "source_section": "<exact location: table + heading + row, e.g. 'Annexure fee table p.34, Infinia row'>"
    }
  ],
  "bank_defaults": {
    "forex": <number percent or null>,
    "forex_exceptions": { "<Card Name>": <number> } | null,   // only if the MITC names per-card exceptions
    "finance_pm_unsecured": <number or null>,   // % per month, unsecured cards
    "finance_pa_unsecured": <number or null>,   // % per annum
    "finance_pm_secured": <number or null>,     // % per month, secured/FD-linked cards (null if none)
    "finance_pa_secured": <number or null>,
    "cash_advance": "<exact text, e.g. '2.5%, min Rs.500'>" | null,
    "late_fee_tiers": "<exact tiered text or value>" | null,
    "interest_free_days": "<e.g. '20-50 days' / 'up to 50 days'>" | null,
    "source_section": "<where the bank-wide charges are stated>"
  }
}

HARD RULES (this is financial data people act on):
  1. NEVER invent a card, a fee, or a charge. If a value is not clearly stated,
     use null. Do not fill from prior knowledge or memory.
  2. Parse ONLY the fee table / charges sections. Numbers are INR integers WITHOUT
     the rupee sign or commas (e.g. "Rs. 12,500" -> 12500; "NIL"/"Free" -> 0).
  3. Copy source_section verbatim enough to locate the value in the document.
  4. Include EVERY distinct card variant in the fee table — do not summarise or cap.
     Drop add-on/supplementary-fee rows and non-card rows.
  5. fee_waiver is the condition TEXT (e.g. "Waived on annual spend of Rs.1 lakh"),
     not a number; null if no waiver is offered.
  6. Many charges (forex, finance %, cash advance, late-fee tiers, interest-free
     days) are stated ONCE for the whole portfolio -> put them in bank_defaults.
     Only set forex_exceptions when the MITC explicitly names a per-card rate.
  7. Output STRICT JSON only. No commentary.

Then WRITE the JSON object to: /Users/rajkumar/Desktop/Card Gyani/cardgyani-site/scraper/parsed/hdfc.json
(Write the file; also return a one-line summary: id + card count.)
