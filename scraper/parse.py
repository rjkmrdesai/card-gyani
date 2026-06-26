#!/usr/bin/env python3
"""Stage 3 — parse extracted MITC text into structured JSON (LLM-driven).

Per README §1/§5 the "LLM" for this stage is Claude Code itself, run **one bank
per call** for tight context. This module is the canonical definition of that
stage: the prompt, the output schema, a validator, and a counter. Two backends:

  * Claude Code (default): `python parse.py --prompts` writes a ready-to-run
    prompt per bank to scraper/parsed/_prompts/<id>.md. A Claude Code subagent
    executes each and writes scraper/parsed/<id>.json. (This is how we run it.)
  * API (optional): if ANTHROPIC_API_KEY is set and the `anthropic` SDK is
    installed, `python parse.py --api` calls the model directly per bank.

Validate + count what's been parsed:
  python parse.py --validate
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

from common import EXTRACTED_DIR, ROOT, load_sources, write_json

PARSED_DIR = ROOT / "parsed"
PROMPTS_DIR = PARSED_DIR / "_prompts"

# ---------------------------------------------------------------- schema ----
# A parsed file: { id, bank, source_url, cards[], bank_defaults{} }
CARD_FIELDS = {"name", "annual_fee", "renewal_fee", "fee_waiver", "source_section",
               # optional per-card overrides (e.g. SBM, where each card has its own
               # charges) — take precedence over bank_defaults at merge time
               "forex", "finance_pm", "finance_pa", "cash_advance", "cash_interest", "late_fee"}
DEFAULT_FIELDS = {
    "forex", "forex_exceptions",
    "finance_pm_unsecured", "finance_pa_unsecured",
    "finance_pm_secured", "finance_pa_secured",
    "cash_advance",        # cash/ATM withdrawal FEE
    "cash_interest",       # interest on cash advances ("revolver"/"after free period")
    "late_fee_tiers", "interest_free_days",
    "source_section",
}

PARSE_PROMPT = """\
You are parsing an Indian credit-card issuer's MITC (Most Important Terms &
Conditions) into strict JSON. Issuer: {bank} (id: {id}).

INPUTS (read these files):
  - Extracted text : {txt_path}
  - Extracted tables: {tables_path}
Source document URL (for provenance): {source_url}
Coverage hint: {coverage}   Per-bank notes: {notes}

GOAL — return ONE JSON object exactly like this (no prose, no markdown fence):
{{
  "id": "{id}",
  "bank": "{bank}",
  "source_url": "{source_url}",
  "cards": [
    {{
      "name": "<card name exactly as printed>",
      "annual_fee": <integer INR or null>,        // first-year / joining / annual membership fee
      "renewal_fee": <integer INR or null>,       // 2nd-year / renewal fee; null if not separately stated
      "fee_waiver": "<exact waiver condition text>" | null,
      "source_section": "<exact location: table + heading + row, e.g. 'Annexure fee table p.34, Infinia row'>"
    }}
  ],
  "bank_defaults": {{
    "forex": <number percent or null>,
    "forex_exceptions": {{ "<Card Name>": <number> }} | null,   // only if the MITC names per-card exceptions
    "finance_pm_unsecured": <number or null>,   // % per month, unsecured cards
    "finance_pa_unsecured": <number or null>,   // % per annum
    "finance_pm_secured": <number or null>,     // % per month, secured/FD-linked cards (null if none)
    "finance_pa_secured": <number or null>,
    "cash_advance": "<cash/ATM withdrawal FEE, exact text e.g. '2.5%, min Rs.500'>" | null,
    "cash_interest": "<interest on cash advances / revolver interest / 'charges after credit-free period', exact text>" | null,
    "late_fee_tiers": "<exact tiered text or value>" | null,
    "interest_free_days": "<e.g. '20-50 days' / 'up to 50 days'>" | null,
    "source_section": "<where the bank-wide charges are stated>"
  }}
}}

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

Then WRITE the JSON object to: {out_path}
(Write the file; also return a one-line summary: id + card count.)
"""


def prompt_for(bank: dict) -> str:
    bid = bank["id"]
    return PARSE_PROMPT.format(
        id=bid, bank=bank["bank"], source_url=bank.get("mitc_url", ""),
        coverage=bank.get("card_coverage", ""), notes=bank.get("notes", ""),
        txt_path=str(EXTRACTED_DIR / f"{bid}.txt"),
        tables_path=str(EXTRACTED_DIR / f"{bid}.tables.json"),
        out_path=str(PARSED_DIR / f"{bid}.json"),
    )


def banks_with_text(banks, only=None):
    out = []
    for b in banks:
        if only and b["id"] not in only:
            continue
        if (EXTRACTED_DIR / f"{b['id']}.txt").exists():
            out.append(b)
    return out


# ---------------------------------------------------------------- validate --
def validate_parsed(obj: dict) -> list[str]:
    errs = []
    for k in ("id", "bank", "cards", "bank_defaults"):
        if k not in obj:
            errs.append(f"missing top-level '{k}'")
    for i, c in enumerate(obj.get("cards", [])):
        if not c.get("name"):
            errs.append(f"card[{i}] missing name")
        for f in ("annual_fee", "renewal_fee"):
            v = c.get(f)
            if v is not None and not isinstance(v, (int, float)):
                errs.append(f"card[{i}] '{f}' must be number or null (got {v!r})")
        extra = set(c) - CARD_FIELDS
        if extra:
            errs.append(f"card[{i}] unexpected fields {extra}")
    bd = obj.get("bank_defaults", {})
    extra = set(bd) - DEFAULT_FIELDS
    if extra:
        errs.append(f"bank_defaults unexpected fields {extra}")
    return errs


def cmd_validate(banks) -> int:
    files = sorted(PARSED_DIR.glob("*.json"))
    if not files:
        print("no parsed/*.json yet — run the parse first.")
        return 1
    total = 0
    print(f"{'bank':<10} {'cards':>5}  {'defaults':<8} status")
    print("-" * 48)
    for f in files:
        if f.name.startswith("_"):
            continue
        obj = json.loads(f.read_text(encoding="utf-8"))
        errs = validate_parsed(obj)
        n = len(obj.get("cards", []))
        total += n
        has_def = "yes" if obj.get("bank_defaults") else "no"
        status = "OK" if not errs else f"{len(errs)} ISSUE(S): " + "; ".join(errs[:2])
        print(f"{obj.get('id',f.stem):<10} {n:>5}  {has_def:<8} {status}")
    print("-" * 48)
    print(f"{'TOTAL':<10} {total:>5} cards across {len([f for f in files if not f.name.startswith('_')])} banks")
    return 0


def cmd_prompts(banks) -> int:
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    for b in banks:
        (PROMPTS_DIR / f"{b['id']}.md").write_text(prompt_for(b), encoding="utf-8")
    print(f"wrote {len(banks)} prompts to {PROMPTS_DIR}")
    print("Run each via a Claude Code subagent; each writes parsed/<id>.json.")
    return 0


def cmd_api(banks) -> int:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        print("ANTHROPIC_API_KEY not set — use --prompts + Claude Code instead.")
        return 1
    try:
        import anthropic
    except ImportError:
        print("`anthropic` SDK not installed (pip install anthropic).")
        return 1
    client = anthropic.Anthropic(api_key=key)
    PARSED_DIR.mkdir(parents=True, exist_ok=True)
    for b in banks:
        txt = (EXTRACTED_DIR / f"{b['id']}.txt").read_text(encoding="utf-8")
        tables = (EXTRACTED_DIR / f"{b['id']}.tables.json").read_text(encoding="utf-8")
        msg = client.messages.create(
            model="claude-opus-4-8", max_tokens=16000,
            messages=[{"role": "user", "content":
                       prompt_for(b) + f"\n\n--- TEXT ---\n{txt}\n\n--- TABLES ---\n{tables}"}],
        )
        raw = msg.content[0].text.strip()
        raw = raw[raw.find("{"): raw.rfind("}") + 1]
        obj = json.loads(raw)
        write_json(PARSED_DIR / f"{b['id']}.json", obj)
        print(f"[api] {b['id']:<9} {len(obj.get('cards', []))} cards")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--prompts", action="store_true", help="write per-bank prompt files")
    ap.add_argument("--api", action="store_true", help="parse via Anthropic API (needs key)")
    ap.add_argument("--validate", action="store_true", help="validate + count parsed/*.json")
    args = ap.parse_args()

    _meta, banks = load_sources()
    only = set(args.only) if args.only else None
    if args.validate:
        return cmd_validate(banks)
    targets = banks_with_text(banks, only)
    if args.api:
        return cmd_api(targets)
    return cmd_prompts(targets)  # default


if __name__ == "__main__":
    sys.exit(main())
