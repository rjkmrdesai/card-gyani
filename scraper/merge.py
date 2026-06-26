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

from common import ROOT, load_sources, write_json, sanitize

PARSED_DIR = ROOT / "parsed"
ENRICHED_DIR = ROOT / "enriched"
OUT_DIR = ROOT / "out"

TODAY = datetime.date.today().isoformat()
BIZ = re.compile(r"\b(business|biz|corporate|vyapaar|merchant|commercial|udyam|gst|empower)\b", re.I)

# Every per-card carve-out applied during merge — written to out/carveouts.csv
# so a human can see which shared clauses were resolved to card-specific values.
CARVEOUTS: list[tuple] = []

# Canonical badge tags — the ONLY values that may appear in the badge column.
# One tag per card; pick the highest-priority match. All LLM-generated free text
# is discarded so the site never shows marketing copy as a "feature badge".
_CAT_NORM = {"super-premium": "super_premium", "super_premium": "super_premium",
             "premium": "premium", "mid-tier": "mid_tier", "mid_tier": "mid_tier",
             "entry": "entry", "travel": "travel", "fuel": "fuel"}


_FD_KEYWORDS = re.compile(
    r"\b(against\s+fd|fd[\s-]backed|fixed\s+deposit|secured|nri\s+secured)\b", re.I
)

# Reward-type cobrand badges — matched on the card NAME (cobrand brand) so they're
# high-confidence; cashback additionally matches a cashback reward currency.
_FUEL_RE = re.compile(r"indianoil|indian oil|\biocl\b|bpcl|hpcl|first power", re.I)
_TRAVEL_RE = re.compile(
    r"\bindigo\b|\b6e\b|vistara|air india|\bemirates\b|etihad|marriott|makemytrip|"
    r"\bmmt\b|miles ?(?:and|&) ?more|krisflyer|jet airways|\batlas\b|\bhorizon\b|"
    r"\byatra\b|skywards|\bmiles\b|accor|\btaj\b|irctc", re.I)
_CASHBACK_NAME_RE = re.compile(r"cashback|cash back|moneyback|money back|amazon pay", re.I)
_CASHBACK_REW_RE = re.compile(
    r"\d+\s*%?\s*cashback|unlimited cashback|flat[^.]{0,12}cashback|cash ?back on", re.I)


def normalize_badge(badge, raw_category, name, forex, rewards=None):
    """Map any free-text badge + card attributes → one pre-verified canonical tag (or None).

    Priority: invite only > super-premium > metal card > premium >
    travel > fuel surcharge waiver > cashback card > low forex markup > FD-linked.
    Tier (super-premium/premium) outranks the reward-type cobrand badges, which
    outrank low-forex; FD-linked is the fallback marker, used only when nothing
    more specific applies.
    """
    bl = (badge or "").lower()
    nm = name or ""
    nl = nm.lower()
    rw = rewards or ""
    cat = _CAT_NORM.get(str(raw_category or "").lower().replace("-", "_"), "")
    if "invite" in bl:
        return "invite only"
    if cat == "super_premium":
        return "super-premium"
    if "metal" in bl or "metal" in nl:
        return "metal card"
    if cat == "premium":
        return "premium"
    if _TRAVEL_RE.search(nm):
        return "travel"
    if _FUEL_RE.search(nm):
        return "fuel surcharge waiver"
    if _CASHBACK_NAME_RE.search(nm) or _CASHBACK_REW_RE.search(rw):
        return "cashback card"
    if forex is not None:
        try:
            if float(forex) <= 1.5:
                return "low forex markup"
        except (TypeError, ValueError):
            pass
    if _FD_KEYWORDS.search(nm):
        return "FD-linked"
    return None


def split_grouped_names(pc: dict, orig_idx: int) -> list[dict]:
    """Expand a comma-joined card name into one dict per name variant.

    HDFC MITCs list multiple variants on one fee row separated by commas
    (e.g. 'Regalia, Regalia Activ, Business Regalia'). Safe guard: only split
    when every comma segment is ≥3 chars and contains no digit (fee amounts like
    '1,000' can't appear in a card name field).
    """
    name = pc.get("name") or ""
    if "," not in name:
        return [{**pc, "_orig_idx": orig_idx}]
    parts = [s.strip() for s in name.split(",")]
    if len(parts) < 2 or any(len(p) < 3 or re.search(r"\d", p) for p in parts):
        return [{**pc, "_orig_idx": orig_idx}]
    return [{**pc, "name": p, "_original_name": name, "_orig_idx": orig_idx} for p in parts]


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


# ── Per-card carve-out parsing ──────────────────────────────────────────────
# MITCs state most charges once for the whole portfolio, then carve out named
# cards: "Transaction fee of 2.5% (Excluding Infinia, Infinia Metal Edition)…"
# or "(Not Applicable for Micro Enterprise Card as cash withdrawal is not
# allowed)". Pasting that bank-wide string onto every card is the bug we fix:
# a card named in an exclusion must NOT inherit the generic value.
_EXCL_RE = re.compile(r"\((?:excluding|not\s+applicable\s+for|except(?:\s+for)?|other\s+than)\s+([^)]+)\)", re.I)
# a card-name segment ends where the explanatory clause ("as cash withdrawal…") begins
_EXCL_TAIL_RE = re.compile(r"\b(as|where|since|because|due to)\b.*$", re.I)


def parse_exclusions(clause: str) -> list[str]:
    """Pull the card names named inside (Excluding …) / (Not Applicable for …)."""
    if not clause:
        return []
    out = []
    for m in _EXCL_RE.finditer(clause):
        seg = _EXCL_TAIL_RE.sub("", m.group(1))
        for part in re.split(r",|/|\band\b|&", seg):
            p = part.strip(" .\t")
            if len(p) >= 3:
                out.append(p)
    return out


def strip_parentheticals(clause: str) -> str:
    """Drop the (Excluding …)/(Not Applicable …) asides so the base reads clean."""
    if not clause:
        return clause
    return re.sub(r"\s*" + _EXCL_RE.pattern, "", clause, flags=re.I).strip(" .,") or clause


def _key_variants(key: str) -> list[str]:
    """A (possibly grouped) exception key → its normalized name variants."""
    return [norm(p) for p in re.split(r",|/", key or "") if norm(p)]


def name_matches_key(name: str, key: str) -> bool:
    """Exact (normalized) match of a card name against one variant of an
    exception/exclusion key. Exact — so 'Infinia' never matches 'Infinia Metal
    Edition' (norm() strips the parentheses, so both reduce cleanly)."""
    nn = norm(name)
    return bool(nn) and any(v == nn for v in _key_variants(key))


def finance_for(bd: dict, ctype: str):
    if ctype == "secured" and bd.get("finance_pm_secured") is not None:
        return bd.get("finance_pm_secured"), bd.get("finance_pa_secured")
    return bd.get("finance_pm_unsecured"), bd.get("finance_pa_unsecured")


def finance_for_card(bd: dict, name: str, ctype: str):
    """(pm, pa, is_exception) — the finance-charge variant table wins over the
    bank default when the MITC names this card (e.g. HDFC super-premium = 1.99%)."""
    for k, v in (bd.get("finance_exceptions") or {}).items():
        if name_matches_key(name, k):
            return v.get("pm"), v.get("pa"), True
    pm, pa = finance_for(bd, ctype)
    return pm, pa, False


def cash_advance_for(bd: dict, name: str):
    """(resolved_text, is_exception) — a card named in an exclusion gets its real
    value, never the generic 2.5% string."""
    for k, v in (bd.get("cash_advance_exceptions") or {}).items():
        if name_matches_key(name, k):
            return v, True
    base = bd.get("cash_advance")
    raw = bd.get("cash_advance_raw") or base or ""
    if base is None:
        base = strip_parentheticals(raw) or None
    for e in parse_exclusions(raw):
        if name_matches_key(name, e):
            # excluded by the MITC but no explicit per-card figure supplied
            return "Excluded from the standard cash advance fee — see card-specific terms", True
    return base, False


def forex_for(bd: dict, name: str):
    """bank default forex, overridden by a per-card exception if the MITC named one."""
    for k, v in (bd.get("forex_exceptions") or {}).items():
        if name_matches_key(name, k):
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
    enr_cards = enriched.get("cards", [])
    enr_by_name = {}
    for c in enr_cards:
        enr_by_name.setdefault(c.get("name"), c)

    # Expand comma-grouped card names (e.g. HDFC 'Regalia, Regalia Activ, ...')
    raw_cards = parsed.get("cards", [])
    flat_cards = []
    for i, pc in enumerate(raw_cards):
        flat_cards.extend(split_grouped_names(pc, i))

    rows = []
    for pc in flat_cards:
        name = pc.get("name")
        orig_name = pc.get("_original_name") or name
        orig_idx = pc.get("_orig_idx", 0)
        # enrichment: exact name → original grouped name → positional (unsplit cards only)
        enr = enr_by_name.get(name)
        if enr is None and orig_name != name:
            enr = enr_by_name.get(orig_name)
        if enr is None and "_original_name" not in pc and len(enr_cards) == len(raw_cards):
            enr = enr_cards[orig_idx]    # positional fallback for null-name rows
        enr = enr or {}

        ctype = card_type(bid, name)
        # per-card overrides (pc.*) win; bank_defaults are then resolved PER CARD
        # so a card named in a carve-out never inherits the generic clause.
        pm = pc.get("finance_pm")
        pa = pc.get("finance_pa")
        fin_exc = False
        if pm is None and pa is None:
            pm, pa, fin_exc = finance_for_card(bd, name, ctype)
        forex = pc.get("forex") if pc.get("forex") is not None else forex_for(bd, name)
        if pc.get("cash_advance"):
            cash_adv, cash_exc = pc["cash_advance"], False
        else:
            cash_adv, cash_exc = cash_advance_for(bd, name)
        cash_int = pc.get("cash_interest") or bd.get("cash_interest")
        late = pc.get("late_fee") or bd.get("late_fee_tiers")
        if fin_exc:
            CARVEOUTS.append((display_bank, name, "finance_charge", f"{pm}% pm / {pa}% pa"))
        if cash_exc:
            CARVEOUTS.append((display_bank, name, "cash_advance", (cash_adv or "")[:90]))

        # stable card_id (dedupe key)
        base = f"{bid}-{kebab(name)}" if name else f"{bid}-unnamed-{orig_idx+1}"
        cid = base
        n = 2
        while cid in seen:
            cid = f"{base}-{n}"; n += 1
        seen.add(cid)

        welcome = enr.get("welcome_benefit")
        features = [x for x in (enr.get("rewards"), enr.get("lounge"), welcome) if x]
        raw_cat = enr.get("category")
        badge = normalize_badge(enr.get("badge"), raw_cat, name, forex, enr.get("rewards"))

        rows.append({
            "card_id": cid,
            "bank": display_bank,
            "name": name,
            "network": enr.get("network"),
            "network_confidence": enr.get("network_confidence"),
            "category": raw_cat,
            "type": ctype,
            "annual_fee": pc.get("renewal_fee") if pc.get("renewal_fee") is not None else pc.get("annual_fee"),
            "joining_fee": pc.get("annual_fee"),
            "fee_waiver": pc.get("fee_waiver"),
            "forex": forex,
            "finance_pm": pm,
            "finance_pa": pa,
            "cash_advance": cash_adv,
            "cash_interest": cash_int,
            "late_fee": late,
            "rewards": enr.get("rewards"),
            "lounge": enr.get("lounge"),
            "welcome_benefit": welcome,
            "features": features,
            "badge": badge,
            "apply_url": enr.get("apply_url"),
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

    # sanitize every string (mojibake / stray U+FFFD) before it reaches a sheet or DB
    all_rows = sanitize(all_rows)
    defaults = sanitize(defaults)

    # write outputs
    write_json(OUT_DIR / "cards.json", all_rows)
    write_json(OUT_DIR / "bank_defaults.json", defaults)
    with (OUT_DIR / "carveouts.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["bank", "card", "clause", "resolved_value"])
        w.writerows(CARVEOUTS)
    with (OUT_DIR / "review.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=REVIEW_COLS, extrasaction="ignore")
        w.writeheader()
        for r in all_rows:
            w.writerow(r)

    matched = sum(1 for r in all_rows if r["match_status"] == "matched")
    print("-" * 26)
    print(f"{'TOTAL':<10} {len(all_rows):>5} {matched:>7}")
    print(f"\nPer-card carve-outs applied: {len(CARVEOUTS)} "
          f"(finance: {sum(1 for c in CARVEOUTS if c[2]=='finance_charge')}, "
          f"cash_advance: {sum(1 for c in CARVEOUTS if c[2]=='cash_advance')}) "
          f"→ {OUT_DIR/'carveouts.csv'}")
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
