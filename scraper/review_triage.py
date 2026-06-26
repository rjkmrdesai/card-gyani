#!/usr/bin/env python3
"""Review triage (review-checklist.md §1) + carve-out leak detector.

Writes out/review-triage.csv (one row per card, BLOCKER/WARN/OK) and runs the
cross-reference check: a card's resolved `cash_advance` or `network` must NOT
contain ANOTHER same-bank card's name. A leak means a shared MITC clause with a
carve-out ("(Excluding X, Y)") was pasted verbatim instead of resolved per card.

Usage:
  python review_triage.py            # CSV for all banks
  python review_triage.py HDFC       # CSV scoped to one bank (cross-ref still global)
"""
from __future__ import annotations
import csv, json, re, sys
from collections import Counter, defaultdict
from urllib.parse import urlparse

ROOT = __import__("pathlib").Path(__file__).resolve().parent
OUT = ROOT / "out"
cards = json.loads((OUT / "cards.json").read_text(encoding="utf-8"))
bank_filter = sys.argv[1] if len(sys.argv) > 1 else None

ALLOWED_CAT = {"super_premium", "premium", "mid_tier", "entry", "travel", "fuel", None}
ALLOWED_TYPE = {"retail", "cobrand", "business", "secured"}
ALLOWED_NET = {"visa", "mastercard", "rupay", "american express", "diners club"}
BANK_DOMAINS = {
    "HDFC": ("hdfc.bank.in", "hdfcbank.com"), "SBI": ("sbicard.com", "sbi.co.in"),
    "ICICI": ("icicibank.com",), "Axis": ("axisbank.com",), "Kotak": ("kotak.com",),
    "RBL": ("rblbank.com",), "IDFC": ("idfcfirstbank.com",), "YES": ("yesbank.in",),
    "IndusInd": ("indusind.com",), "BoB": ("bobcard.co.in", "bankofbaroda.in"),
    "AMEX": ("americanexpress.com",), "Federal": ("federalbank.co.in",), "SBM": ("sbmbank.co.in",),
}

def norm(s):  # lower, collapse non-alphanumerics to single spaces
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()

def fnum(v):
    try: return float(v)
    except (TypeError, ValueError): return None

ids = [c["card_id"] for c in cards]

# ── cross-reference leak check ──────────────────────────────────────────────
# Build per-bank distinctive card names; flag a field that names a *different*
# card in the same bank. Guards against false positives:
#  - name must be ≥6 normalized chars (skip generic short tokens)
#  - skip names in a sub/superstring relationship with the card's own name
#    (e.g. "Regalia" vs "Regalia Gold" — same family, not a leak)
by_bank_names = defaultdict(list)
for c in cards:
    if c.get("name"):
        by_bank_names[c["bank"]].append(c["name"])

def crossref_leaks(c):
    me = norm(c.get("name"))
    hits = []
    for field in ("cash_advance", "network"):
        v = norm(c.get(field))
        if not v:
            continue
        for other in by_bank_names[c["bank"]]:
            n = norm(other)
            if len(n) < 6 or n == me:
                continue
            if n in me or me in n:          # same family / own name
                continue
            if re.search(rf"(?:^| ){re.escape(n)}(?: |$)", v):
                hits.append(f"{field}:“{other}”")
    return hits

# ── §1 per-card checks ──────────────────────────────────────────────────────
def triage(c):
    blockers, warns = [], []
    name = c.get("name")
    if ids.count(c["card_id"]) > 1: blockers.append("dup card_id")
    if not name: warns.append("null name")
    if c.get("category") not in ALLOWED_CAT: blockers.append(f"bad category")
    if c.get("type") not in ALLOWED_TYPE: blockers.append("bad type")
    net = c.get("network")
    if net and not all(p.strip() in ALLOWED_NET for p in re.split(r"[/,]", net.lower()) if p.strip()):
        blockers.append(f"bad network={net}")
    for p in ("source_url", "source_section", "mitc_last_checked", "data_status"):
        if not c.get(p): warns.append(f"missing {p}")
    fx = fnum(c.get("forex"))
    if fx is not None and not (0 <= fx <= 5): blockers.append(f"forex {fx}∉0–5")
    pm, pa = fnum(c.get("finance_pm")), fnum(c.get("finance_pa"))
    if pm is not None and not (0 <= pm <= 4): blockers.append(f"finance_pm {pm}∉0–4")
    if pa is not None and not (0 <= pa <= 55): blockers.append(f"finance_pa {pa}∉0–55")
    if pm is not None and pa is not None and abs(pa - pm * 12) > 2:
        blockers.append(f"pa≠pm×12 ({pa} vs {pm*12:.1f})")
    if not c.get("cash_advance"): warns.append("empty cash_advance")
    if not c.get("late_fee"): warns.append("empty late_fee")
    # apply-link: format + bank domain (live HTTP-200 deferred to stage-6 human review)
    url = c.get("apply_url"); apply_status = "missing"
    if url:
        u = urlparse(url); host = (u.netloc or "").lower().removeprefix("www.")
        if u.scheme != "https": apply_status = "not-https"; blockers.append("apply_url not https")
        elif not any(host.endswith(h) for h in BANK_DOMAINS.get(c["bank"], ())):
            apply_status = f"foreign-host:{host}"; blockers.append("apply_url off-domain")
        else: apply_status = "ok-format"
    else: warns.append("no apply_url")
    for f in ("rewards", "lounge", "badge"):
        if not c.get(f): warns.append(f"no {f}")
    leaks = crossref_leaks(c)
    if leaks: blockers.append("CARVEOUT LEAK: " + "; ".join(leaks))
    sev = "BLOCKER" if blockers else ("WARN" if warns else "OK")
    return sev, blockers, warns, apply_status, leaks

rows = []
for c in cards:
    sev, blockers, warns, apply_status, leaks = triage(c)
    rows.append({
        "card_id": c["card_id"], "bank": c["bank"], "name": c.get("name") or "",
        "severity": sev, "failed_checks": "; ".join(blockers + warns) or "—",
        "annual_fee": c.get("annual_fee"), "forex": c.get("forex"),
        "finance_pm": c.get("finance_pm"), "apply_url_status": apply_status,
        "source_section": (c.get("source_section") or "")[:80],
        "_leaks": leaks,
    })

order = {"BLOCKER": 0, "WARN": 1, "OK": 2}
rows.sort(key=lambda r: (order[r["severity"]], r["bank"], r["card_id"]))

# ── write CSV (optionally bank-scoped) ──────────────────────────────────────
COLS = ["card_id", "bank", "name", "severity", "failed_checks", "annual_fee",
        "forex", "finance_pm", "apply_url_status", "source_section"]
csv_rows = [r for r in rows if not bank_filter or r["bank"] == bank_filter]
with (OUT / "review-triage.csv").open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
    w.writeheader(); w.writerows(csv_rows)

# ── report ──────────────────────────────────────────────────────────────────
scope = bank_filter or "ALL"
sev_counts = Counter(r["severity"] for r in csv_rows)
print(f"review-triage.csv → {len(csv_rows)} rows ({scope})  "
      f"BLOCKER={sev_counts['BLOCKER']} WARN={sev_counts['WARN']} OK={sev_counts['OK']}")

leaks_all = [r for r in rows if r["_leaks"]]
print(f"\n=== Carve-out leak check (cash_advance / network contains another card's name) ===")
print(f"Scanned {len(cards)} cards across {len(by_bank_names)} banks.")
hdfc_leaks = [r for r in leaks_all if r["bank"] == "HDFC"]
print(f"HDFC leaks: {len(hdfc_leaks)}" + ("  ✓ clean" if not hdfc_leaks else ""))
if leaks_all:
    print(f"Total leaks (all banks): {len(leaks_all)}")
    for r in leaks_all:
        print(f"  [{r['bank']}] {r['name']}: {'; '.join(r['_leaks'])}")
else:
    print("Total leaks (all banks): 0  ✓ no card's cash_advance/network embeds another card's name")

# sample HDFC card row
print("\n=== Sample HDFC card in the triage ===")
sample = next((r for r in csv_rows if r["bank"] == "HDFC" and "Infinia (Metal" in r["name"]),
              next((r for r in csv_rows if r["bank"] == "HDFC"), None))
if sample:
    for k in COLS:
        print(f"  {k}: {sample[k]}")
