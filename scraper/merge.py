#!/usr/bin/env python3
"""Stage 5 — merge parsed + enriched into final rows.

Flattens parsed (fees) x enriched (rewards/lounge/etc.) per card, stamps each
bank's portfolio-wide bank_defaults onto every card with per-card overrides
(forex exceptions; secured vs unsecured finance rate), dedupes on a stable
card_id, and tags every row data_status="needs_review" (the human gate is
stage 6 — nothing is auto-published).

Outputs:
  scraper/out/cards.json          final rows (README §4a shape)
  scraper/out/review.csv          one row per card: key fields + source_section
  scraper/out/bank_defaults.json  each bank's portfolio-wide terms (README §4c)

Usage: python merge.py
(Run after parse.py + enrich.py. Does NOT touch Supabase.)
"""
from __future__ import annotations
import csv
import datetime
import json
import re
import sys

from common import ROOT, load_sources, write_json

PARSED_DIR = ROOT / "parsed"
ENRICHED_DIR = ROOT / "enriched"
OUT_DIR = ROOT / "out"

TODAY = datetime.date.today().isoformat()
BIZ = re.compile(r"\b(business|biz|corporate|vyapaar|merchant|commercial|udyam|gst|empower)\b", re.I)


def kebab(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def card_type(bank_id: str, name: str) -> str:
    """Best-effort type. secured & business are detectable; cobrand is NOT
    reliably derivable from fee/MITC data, so co-brands default to 'retail'
    and are corrected in the stage-6 human review."""
    n = (name or "").lower()
    if bank_id == "sbm" or "secured" in n or "fd-linked" in n or "against fd" in n:
        return "secured"
    if BIZ.search(n):
        return "business"
    return "retail"


def finance_for(bd: dict, ctype: str):
    if ctype == "secured" and bd.get("finance_pm_secured") is not None:
        return bd.get("finance_pm_secured"), bd.get("finance_pa_secured")
    return bd.get("finance_pm_unsecured"), bd.get("finance_pa_unsecured")


def forex_for(bd: dict, name: str):
    """bank default forex, overridden by a per-card exception if the MITC named one."""
    exc = bd.get("forex_exceptions") or {}
    if exc:
        want = norm(name)
        for k, v in exc.items():
            if norm(k) == want:
                return v
    return bd.get("forex")


def load_bank(bid: str):
    p = PARSED_DIR / f"{bid}.json"
    e = ENRICHED_DIR / f"{bid}.json"
    if not p.exists():
        return None
    parsed = json.loads(p.read_text(encoding="utf-8"))
    enriched = json.loads(e.read_text(encoding="utf-8")) if e.exists() else {"cards": []}
    return parsed, enriched


def merge_bank(bid: str, display_bank: str, parsed: dict, enriched: dict, seen: set):
    bd = parsed.get("bank_defaults", {}) or {}
    source_url = parsed.get("source_url", "")
    # enrichment lookups: by exact name, with a positional fallback
    enr_cards = enriched.get("cards", [])
    enr_by_name = {}
    for c in enr_cards:
        enr_by_name.setdefault(c.get("name"), c)

    rows = []
    for i, pc in enumerate(parsed.get("cards", [])):
        name = pc.get("name")
        enr = enr_by_name.get(name)
        if enr is None and len(enr_cards) == len(parsed.get("cards", [])):
            enr = enr_cards[i]           # positional fallback (e.g. null-name rows)
        enr = enr or {}

        ctype = card_type(bid, name)
        pm, pa = finance_for(bd, ctype)

        # stable card_id (dedupe key)
        base = f"{bid}-{kebab(name)}" if name else f"{bid}-unnamed-{i+1}"
        cid = base
        n = 2
        while cid in seen:
            cid = f"{base}-{n}"; n += 1
        seen.add(cid)

        welcome = enr.get("welcome_benefit")
        features = [x for x in (enr.get("rewards"), enr.get("lounge"), welcome) if x]

        rows.append({
            "card_id": cid,
            "bank": display_bank,
            "name": name,
            "network": enr.get("network"),
            "network_confidence": enr.get("network_confidence"),
            "category": enr.get("category"),
            "type": ctype,
            "annual_fee": pc.get("renewal_fee") if pc.get("renewal_fee") is not None else pc.get("annual_fee"),
            "joining_fee": pc.get("annual_fee"),
            "fee_waiver": pc.get("fee_waiver"),
            "forex": forex_for(bd, name),
            "finance_pm": pm,
            "finance_pa": pa,
            "cash_advance": bd.get("cash_advance"),       # cash/ATM withdrawal fee
            "cash_interest": bd.get("cash_interest"),     # interest on cash advances
            "late_fee": bd.get("late_fee_tiers"),
            "rewards": enr.get("rewards"),
            "lounge": enr.get("lounge"),
            "welcome_benefit": welcome,
            "features": features,
            "badge": enr.get("badge"),
            "apply_url": enr.get("apply_url"),
            # provenance / QA (README §4b) — the public site can ignore these
            "source_url": source_url,
            "source_section": pc.get("source_section"),
            "enrich_source": enr.get("enrich_source"),
            "match_status": enr.get("match_status", "unmatched"),
            "mitc_last_checked": TODAY,
            "data_status": "needs_review",
        })
    return rows


REVIEW_COLS = ["card_id", "bank", "name", "type", "category", "joining_fee", "annual_fee",
               "fee_waiver", "forex", "finance_pm", "finance_pa", "cash_advance",
               "cash_interest", "late_fee", "network", "network_confidence", "rewards",
               "lounge", "badge", "apply_url", "match_status", "data_status",
               "source_section", "source_url"]


def main() -> int:
    _meta, banks = load_sources()
    display = {b["id"]: b["bank"] for b in banks}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_rows, defaults, seen = [], {}, set()
    print(f"{'bank':<10} {'rows':>5} {'matched':>7}")
    print("-" * 26)
    for b in banks:
        bid = b["id"]
        loaded = load_bank(bid)
        if not loaded:
            continue
        parsed, enriched = loaded
        defaults[bid] = parsed.get("bank_defaults", {})
        rows = merge_bank(bid, display[bid], parsed, enriched, seen)
        all_rows.extend(rows)
        m = sum(1 for r in rows if r["match_status"] == "matched")
        print(f"{bid:<10} {len(rows):>5} {m:>7}")

    # write outputs
    write_json(OUT_DIR / "cards.json", all_rows)
    write_json(OUT_DIR / "bank_defaults.json", defaults)
    with (OUT_DIR / "review.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=REVIEW_COLS, extrasaction="ignore")
        w.writeheader()
        for r in all_rows:
            w.writerow(r)

    matched = sum(1 for r in all_rows if r["match_status"] == "matched")
    print("-" * 26)
    print(f"{'TOTAL':<10} {len(all_rows):>5} {matched:>7}")
    print(f"\nAll rows data_status='needs_review'. Wrote:")
    print(f"  {OUT_DIR/'cards.json'}  ({len(all_rows)} rows)")
    print(f"  {OUT_DIR/'review.csv'}")
    print(f"  {OUT_DIR/'bank_defaults.json'}  ({len(defaults)} banks)")
    # dedupe sanity
    ids = [r["card_id"] for r in all_rows]
    dupes = {i for i in ids if ids.count(i) > 1}
    print(f"  card_id unique: {len(set(ids))}/{len(ids)}" + (f"  DUPES: {dupes}" if dupes else "  (no collisions)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
