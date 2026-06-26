#!/usr/bin/env python3
"""Stage 4 — enrich parsed cards with product-page data (LLM-driven).

For each bank: verify its product_listing_url resolves (search for the live page
if it 404s), scrape the product/listing pages, and add rewards, lounge,
welcome_benefit, network, category, badge and apply_url to each parsed card,
matched by NORMALIZED name. Cards that can't be confidently matched keep null
enrichment and are flagged (match_status). Output: scraper/enriched/<id>.json.

Per README §1/§5 the LLM here is Claude Code: run one bank per subagent. This
module provides the canonical prompt, the name-normalizer (so matching is
consistent), a URL resolver pre-check, and a validator/counter.

  python enrich.py --check-urls   # HTTP-check every product_listing_url
  python enrich.py --prompts      # write per-bank enrichment prompts
  python enrich.py --validate     # validate + count matched/unmatched
"""
from __future__ import annotations
import argparse
import json
import re
import sys

import requests

from common import ROOT, BROWSER_UA, load_sources, write_json

PARSED_DIR = ROOT / "parsed"
ENRICHED_DIR = ROOT / "enriched"
PROMPTS_DIR = ENRICHED_DIR / "_prompts"

ENRICH_FIELDS = {"network", "category", "rewards", "lounge",
                 "welcome_benefit", "badge", "apply_url"}
CARD_FIELDS = ENRICH_FIELDS | {"name", "match_status", "enrich_source",
                               "network_confidence"}
CATEGORIES = {"super_premium", "premium", "mid_tier", "entry"}

# strip issuer noise so "SimplyCLICK SBI Card" ~ "simplyclick"
_STRIP = re.compile(
    r"\b(sbi\s*card|hdfc\s*bank|icici\s*bank|axis\s*bank|kotak|idfc\s*first|"
    r"indusind|bobcard|bank\s*of\s*baroda|american\s*express|amex|federal|"
    r"yes\s*bank|rbl|sbm|credit\s*card|by)\b", re.I)


def normalize_name(name: str) -> str:
    s = (name or "").lower()
    s = _STRIP.sub(" ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def prompt_for(bank: dict) -> str:
    bid = bank["id"]
    return ENRICH_PROMPT.format(
        id=bid, bank=bank["bank"],
        listing=bank.get("product_listing_url", ""),
        notes=bank.get("notes", ""),
        parsed_path=str(PARSED_DIR / f"{bid}.json"),
        out_path=str(ENRICHED_DIR / f"{bid}.json"),
    )


ENRICH_PROMPT = """\
You are stage 4 (enrichment) of the Card Gyani scraper for ONE bank: {bank} (id: {id}).

INPUTS:
  - Parsed cards (names to match against): {parsed_path}
  - Candidate product listing URL: {listing}
  - Per-bank notes: {notes}
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

OUTPUT — write this JSON to {out_path}:
{{
  "id": "{id}", "bank": "{bank}",
  "product_listing_url": "<the URL you actually used>",
  "listing_url_status": "ok" | "replaced" | "unresolved",
  "cards": [
    {{
      "name": "<EXACT name from the parsed file>",   // so merge can join
      "match_status": "matched" | "low_confidence" | "unmatched",
      "network": <str|null>, "category": <"super_premium"|"premium"|"mid_tier"|"entry"|null>,
      "rewards": <str|null>, "lounge": <str|null>, "welcome_benefit": <str|null>,
      "badge": <str|null>, "apply_url": <str|null>,
      "enrich_source": <url string you took the data from | null>
    }}
  ]
}}

HARD RULES:
  - NEVER fill rewards/lounge/welcome/network/badge from memory. Only from fetched
    bank pages. If you didn't find it on a page, the field is null.
  - apply_url MUST be a real URL you fetched/verified on the bank's own domain, else null.
  - If a parsed card can't be confidently matched to a product page, set match_status
    "unmatched" and leave ALL enrichment fields null. Include it anyway (every parsed
    card must appear) so stage 5 can merge.
  - category is your classification from the card's positioning/fee tier (4 buckets only).
  - Output STRICT JSON only, then return a one-line summary.

Return ONLY: "{id}: <matched>/<total> matched, listing <ok|replaced|unresolved>" + caveats.
Do NOT paste the JSON back.
"""


def cmd_check_urls(banks) -> int:
    sess = requests.Session()
    sess.headers.update({"User-Agent": BROWSER_UA})
    print(f"{'bank':<10} {'http':>5}  url")
    print("-" * 70)
    bad = 0
    for b in banks:
        url = b.get("product_listing_url", "")
        try:
            r = sess.get(url, timeout=30, allow_redirects=True)
            code = r.status_code
        except requests.RequestException as e:
            code = type(e).__name__
        ok = isinstance(code, int) and code < 400
        if not ok:
            bad += 1
        print(f"{b['id']:<10} {str(code):>5}  {url}")
    print("-" * 70)
    print(f"{len(banks)-bad}/{len(banks)} resolve; {bad} need a live-page search (agents handle this).")
    return 0


def validate_enriched(obj: dict) -> list[str]:
    errs = []
    for k in ("id", "bank", "cards"):
        if k not in obj:
            errs.append(f"missing '{k}'")
    for i, c in enumerate(obj.get("cards", [])):
        if not c.get("name"):
            errs.append(f"card[{i}] missing name")
        if c.get("category") not in CATEGORIES and c.get("category") is not None:
            errs.append(f"card[{i}] bad category {c.get('category')!r}")
        if c.get("match_status") not in {"matched", "low_confidence", "unmatched", None}:
            errs.append(f"card[{i}] bad match_status {c.get('match_status')!r}")
        extra = set(c) - CARD_FIELDS
        if extra:
            errs.append(f"card[{i}] unexpected {extra}")
    return errs


def cmd_validate(banks) -> int:
    files = sorted(p for p in ENRICHED_DIR.glob("*.json") if not p.name.startswith("_"))
    if not files:
        print("no enriched/*.json yet.")
        return 1
    tot = matched = 0
    print(f"{'bank':<10} {'total':>5} {'matched':>7} {'url':<10} status")
    print("-" * 60)
    for f in files:
        obj = json.loads(f.read_text(encoding="utf-8"))
        errs = validate_enriched(obj)
        cards = obj.get("cards", [])
        m = sum(1 for c in cards if c.get("match_status") == "matched")
        tot += len(cards); matched += m
        st = "OK" if not errs else f"{len(errs)} issue(s)"
        print(f"{obj.get('id', f.stem):<10} {len(cards):>5} {m:>7} "
              f"{obj.get('listing_url_status', '?'):<10} {st}")
    print("-" * 60)
    print(f"{'TOTAL':<10} {tot:>5} {matched:>7}  ({tot-matched} unmatched/flagged)")
    return 0


def cmd_prompts(banks) -> int:
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    have = [b for b in banks if (PARSED_DIR / f"{b['id']}.json").exists()]
    for b in have:
        (PROMPTS_DIR / f"{b['id']}.md").write_text(prompt_for(b), encoding="utf-8")
    print(f"wrote {len(have)} prompts to {PROMPTS_DIR}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--check-urls", action="store_true")
    ap.add_argument("--prompts", action="store_true")
    ap.add_argument("--validate", action="store_true")
    args = ap.parse_args()

    _meta, banks = load_sources()
    if args.only:
        banks = [b for b in banks if b["id"] in set(args.only)]

    if args.check_urls:
        return cmd_check_urls(banks)
    if args.validate:
        return cmd_validate(banks)
    return cmd_prompts(banks)


if __name__ == "__main__":
    sys.exit(main())
