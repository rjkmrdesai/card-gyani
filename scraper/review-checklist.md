# Card Gyani — Card Data Review Checklist

Purpose: make verifying scraped MITC data **fast and safe**. The idea is *triage, not eyeball-everything*.
Claude Code runs the automated checks first and produces a prioritized shortlist; a human only
hand-checks the high-stakes and flagged cards.

> Wrong fees on a comparison site are a real liability. The goal of this pass: every published
> number is traceable to a source and has passed either an automated rule or a human glance.

---

## How to run this (Claude Code)

> *"Read `scraper/review-checklist.md`. Run all the AUTOMATED CHECKS in §1 against
> `scraper/out/cards.json`. Produce `scraper/out/review-triage.csv` with one row per card:
> `card_id, bank, name, severity (BLOCKER/WARN/OK), failed_checks, annual_fee, forex,
> finance_pm, apply_url_status, source_section`. Sort BLOCKER first, then WARN, then OK.
> Also print a summary: counts per severity, and the §3 'always hand-check' list. Do NOT mark
> anything `verified` — only I do that after review."*

Then you work top-down through the CSV: fix BLOCKERs, glance at WARNs, sample the OKs.

---

## 1. Automated checks (Claude Code runs these — no human needed)

**Structural**
- [ ] `card_id` unique across the whole file (no duplicates).
- [ ] `name` non-empty; `bank` matches an allowed bank value.
- [ ] `category` in {super_premium, premium, mid_tier, entry}; `type` in {retail, cobrand, business, secured}.
- [ ] `network` in {Visa, Mastercard, RuPay, American Express, Diners Club} (or a combo of these).
- [ ] Provenance present: `source_url`, `source_section`, `mitc_last_checked`, `data_status` all set.

**Fee sanity** (flag as BLOCKER if violated)
- [ ] `annual_fee`, `joining_fee` are integers ≥ 0. Flag anything negative or > ₹1,00,000 for a human look.
- [ ] `forex` is a number in 0–5. (0 is valid = forex-free; just confirm it wasn't lost to a default.)
- [ ] `finance_pm` in 0–4; `finance_pa` in 0–55.
- [ ] **Consistency:** `finance_pa` ≈ `finance_pm × 12` (within ±2). Mismatch usually means a per-month / per-annum mix-up.
- [ ] `cash_advance` and `late_fee` are non-empty for any card that charges fees.

**Bank-default consistency** (WARN)
- [ ] For each card, `forex`/`finance_pm`/`cash_advance`/`late_fee` either equal the bank's default
      (from `out/bank_defaults.json`) **or** there is a documented exception in `source_section`.
      Flag any *silent* deviation from the bank default.

**Apply link** (BLOCKER if broken)
- [ ] `apply_url` present and well-formed (https).
- [ ] Host is the **bank's own domain** (e.g. hdfcbank.com, axisbank.com) — not a competitor,
      aggregator, or affiliate link pasted by mistake.
- [ ] URL returns HTTP 200 (do a quick HEAD request; flag 4xx/5xx or a redirect to the bank's homepage).

**Enrichment completeness** (WARN, expected for some)
- [ ] `rewards`, `lounge`, `features`, `badge` not null. List cards missing these so they can be
      filled or intentionally left blank.

**Status**
- [ ] Surface every row where `data_status = "needs_review"` at the top regardless of other checks.

---

## 2. The MITC traps (what the automated checks can't catch — human judgment)

These are the recurring ways MITC data goes wrong. Hand-checkers should watch for them:

1. **Annual vs joining/first-year fee.** MITCs often list "first year fee" and a separate
   "renewal/annual fee". Confirm `annual_fee` is the *recurring* fee, not the joining fee.
2. **Pre-GST figures.** Most MITCs quote fees **excluding GST**. Keep the whole site consistent
   (store pre-GST, note "+GST" once on the site). Flag any card that looks GST-inclusive.
3. **Waiver unit errors.** "₹1 lakh" vs "₹1,00,000" vs "₹10,00,000" — a missing zero turns a
   ₹1L waiver into ₹10L. Re-read the threshold against the source.
4. **Forex 0% lost.** A genuinely forex-free card must show 0, not the bank's 3.5% default.
5. **Finance: secured vs unsecured.** Secured (FD-linked) cards usually have a lower rate. Make
   sure secured cards didn't inherit the unsecured default.
6. **Late-fee ladder truncated.** Capture the full tier table, not just the first row.
7. **Cash advance min cap.** Should be "% , min ₹___" — confirm both the percent and the floor.
8. **OCR misreads** (the scanned banks, esp. IndusInd 2016): `0↔O`, `1↔l`, `5↔S`, dropped commas
   (₹2500 vs ₹25,000). Hand-check OCR'd banks harder.
9. **Stale documents.** IndusInd's MITC is dated 2016. Flag the date; verify the card/fees are
   still offered. Discontinued cards shouldn't be published.
10. **Non-cards as cards.** Add-on/supplementary card fees, EMI charges, or generic rows
    sometimes parse as a "card". Drop them.
11. **Wrong-card enrichment.** Rewards/lounge text pasted from a sibling card during name-matching.
    Spot-check that the benefit actually belongs to *this* card.

---

## 3. Always hand-check 100% of these (don't sample)

- [ ] Every **super_premium** and **premium** card (high fees, most viewed, highest stakes).
- [ ] Every card flagged **BLOCKER** or **WARN** by §1.
- [ ] Every card from the **OCR'd / scanned** bank(s) (IndusInd, plus any the scraper auto-OCR'd).
- [ ] Every **secured (FD-linked)** card (verify the secured rate + the FD-linked tag).
- [ ] Any bank whose **parsed card count looked off** (too few/too many vs the bank's real lineup).

For everything else (entry/mid-tier, passing all auto-checks): **random 10–15% sample** is enough.

---

## 4. The 30-second per-card glance

For each card being hand-checked, open the `source_url` to the `source_section` and confirm:

1. Is this a **real, currently-offered** card with this exact name?
2. `annual_fee` correct — and is it the **annual** (not joining) fee?
3. Waiver condition correct, **units right**?
4. `forex` right (and 0% not lost to a default)?
5. `finance_pm`/`finance_pa` consistent and matched to secured/unsecured?
6. **Apply Now opens the correct bank page for THIS card** (click it).
7. Rewards/lounge plausible and belong to this card?

If all 7 pass → set `data_status = "verified"`. If not → fix, or set `needs_review` with a note.

---

## 5. Finishing the pass

- [ ] All BLOCKERs resolved (fixed or removed).
- [ ] All §3 cards hand-checked and marked `verified`.
- [ ] Sample of the rest checked; no systemic issue found (if the sample shows a pattern, widen it).
- [ ] Push verified data to Supabase (upsert on `card_id`), then one Vercel **Redeploy**.
- [ ] Confirm the live homepage count matches the verified row count.

Keep the `mitc_last_checked` date current — it's what the site's "verify on bank site" note relies on,
and what the monthly `refresh` job diffs against.
