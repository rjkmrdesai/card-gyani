#!/usr/bin/env python3
"""README §6 — keep the catalog current WITHOUT silently overwriting.

Re-fetches every source, re-extracts, flags which MITCs actually changed, and
DIFFs the freshly-built rows against what's live in Supabase — writing
out/changes.csv (field-level old -> new, with source) for human approval.
Nothing is written to Supabase here.

Flow:
  python refresh.py --fetch     # re-fetch + re-extract all; report changed sources
  # (re-parse + enrich + merge the CHANGED banks via the normal LLM pipeline:
  #   python parse.py --prompts --only <changed ids>  -> run subagents
  #   python enrich.py --prompts --only <changed ids> -> run subagents
  #   python merge.py)
  python refresh.py             # diff out/cards.json vs Supabase -> out/changes.csv
  # review out/changes.csv, then apply approved changes with load.py

The diff is the safe default; --fetch is the network step.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import subprocess
import sys

import requests

from common import ROOT, EXTRACTED_DIR, load_sources, sanitize
from load import SUPABASE_URL, ANON_KEY

OUT_DIR = ROOT / "out"
CARDS_JSON = OUT_DIR / "cards.json"
CHANGES_CSV = OUT_DIR / "changes.csv"
HASH_FILE = OUT_DIR / ".source_hashes.json"

# (scraper key in cards.json, Supabase column) — substantive fields we diff on.
# Meta fields (mitc_last_checked, data_status, *_confidence, match_status) are
# excluded so the report shows real catalog changes, not run-to-run noise.
COMPARE = [
    ("bank", "bank_name"), ("name", "card_name"), ("network", "network"),
    ("category", "category"), ("type", "card_type"),
    ("annual_fee", "annual_fee"), ("joining_fee", "joining_fee"),
    ("fee_waiver", "fee_waiver"), ("forex", "forex_markup_pct"),
    ("finance_pm", "finance_charge_monthly_pct"), ("finance_pa", "finance_charge_annual_pct"),
    ("cash_advance", "cash_advance_fee"), ("cash_interest", "cash_interest"),
    ("late_fee", "late_payment_fee"), ("rewards", "reward_summary"),
    ("lounge", "lounge_access"), ("welcome_benefit", "welcome_benefit"),
    ("features", "features"), ("badge", "badge"), ("apply_url", "apply_url"),
]
NUMERIC = {"annual_fee", "joining_fee", "forex", "finance_pm", "finance_pa"}
# Free-text descriptions get re-worded on every LLM re-parse even when the value
# is unchanged. By default we flag these only on a PRESENCE change (value <-> null),
# not on re-wording. Pass --wording to surface every text edit too.
TEXT_FIELDS = {"fee_waiver", "cash_advance", "cash_interest", "late_fee",
               "rewards", "lounge", "welcome_benefit", "badge"}


def norm(field, v):
    """Normalize for comparison so 3.5 == '3.50', whitespace/None/'' don't churn."""
    if v is None or v == "":
        return None
    if field in NUMERIC:
        try:
            return round(float(v), 6)
        except (TypeError, ValueError):
            return str(v)
    if field == "features":
        if isinstance(v, list):
            return [sanitize(str(x)).strip() for x in v]
        return [sanitize(str(v)).strip()]
    return sanitize(str(v)).strip() or None


def show(v):
    if isinstance(v, list):
        return " | ".join(str(x) for x in v)
    return "" if v is None else str(v)


# ---------------------------------------------------------------- fetch ----
def cmd_fetch():
    print("re-fetching + re-extracting all sources...\n")
    subprocess.run([sys.executable, "fetch.py", "--refresh"], cwd=ROOT)
    subprocess.run([sys.executable, "extract.py"], cwd=ROOT)

    prev = json.loads(HASH_FILE.read_text()) if HASH_FILE.exists() else {}
    now, changed, new = {}, [], []
    _meta, banks = load_sources()
    for b in banks:
        f = EXTRACTED_DIR / f"{b['id']}.txt"
        if not f.exists():
            continue
        h = hashlib.sha256(f.read_bytes()).hexdigest()
        now[b["id"]] = h
        if b["id"] not in prev:
            new.append(b["id"])
        elif prev[b["id"]] != h:
            changed.append(b["id"])
    HASH_FILE.write_text(json.dumps(now, indent=2))

    print("\n=== source change detection (vs last refresh) ===")
    print(f"  changed : {changed or 'none'}")
    print(f"  new     : {new or 'none'}")
    print(f"  total tracked: {len(now)}")
    if changed or new:
        ids = " ".join(changed + new)
        print(f"\nNext: re-parse + enrich + merge the changed banks, then run `refresh.py`:")
        print(f"  python parse.py --prompts --only {ids}   # then run a subagent per bank")
        print(f"  python enrich.py --prompts --only {ids}  # then run a subagent per bank")
        print(f"  python merge.py")
    else:
        print("\nNo source content changed since last refresh.")
    return 0


# ---------------------------------------------------------------- diff -----
def fetch_supabase():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/cards", params={"select": "*", "limit": "5000"},
                     headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"},
                     timeout=60)
    r.raise_for_status()
    return r.json()


def cmd_diff(wording=False):
    new_rows = json.loads(CARDS_JSON.read_text(encoding="utf-8"))
    new = {c["card_id"]: c for c in new_rows}
    try:
        cur_rows = fetch_supabase()
    except Exception as e:
        print(f"Could not read Supabase: {e}")
        return 1
    cur = {(r.get("card_id") or r.get("slug")): r for r in cur_rows}

    changes = []
    for cid, n in new.items():
        src_sec, src_url = n.get("source_section"), n.get("source_url")
        if cid not in cur:
            changes.append([cid, n.get("bank"), n.get("name"), "(new card)", "", show(n.get("name")), src_sec, src_url])
            continue
        c = cur[cid]
        for key, col in COMPARE:
            o_raw, v_raw = c.get(col), n.get(key)
            o, v = norm(key, o_raw), norm(key, v_raw)
            if key in TEXT_FIELDS and not wording:
                differs = (o is None) != (v is None)   # presence change only
            else:
                differs = o != v
            if differs:
                changes.append([cid, n.get("bank"), n.get("name"), key, show(o_raw), show(v_raw), src_sec, src_url])
    for cid, c in cur.items():
        if cid not in new:
            changes.append([cid, c.get("bank_name"), c.get("card_name"), "(removed from source)",
                            show(c.get("card_name")), "", c.get("source_section"), c.get("source_url")])

    with CHANGES_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["card_id", "bank", "name", "field", "old_value", "new_value",
                    "source_section", "source_url"])
        w.writerows(changes)

    # summary
    added = sum(1 for r in changes if r[3] == "(new card)")
    removed = sum(1 for r in changes if r[3] == "(removed from source)")
    field_changes = len(changes) - added - removed
    cards_touched = len({r[0] for r in changes})
    print(f"DB rows: {len(cur)}   new rows: {len(new)}")
    print(f"changes: {len(changes)}  ({field_changes} field edits, {added} new cards, {removed} removed)")
    print(f"cards affected: {cards_touched}")
    print(f"\nWrote {CHANGES_CSV} — review and approve; NOTHING was written to Supabase.")
    print("Apply approved changes with:  python load.py  (then apply out/upsert.sql)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true", help="re-fetch + re-extract; detect changed sources")
    ap.add_argument("--wording", action="store_true", help="also flag re-worded free-text fields")
    args = ap.parse_args()
    return cmd_fetch() if args.fetch else cmd_diff(wording=args.wording)


if __name__ == "__main__":
    sys.exit(main())
