/* ============================================================
   Card Gyani — eligibility scoring (client-side, pure JS).
   No DOM, no Node, no Supabase at runtime. The card catalogue
   is passed in from the build (same pattern as core.js); this
   module only carries the synthetic eligibility attributes that
   don't yet exist as Supabase columns, plus the scoring maths.

   The eligibility attributes below are a hand-authored static
   map keyed by card slug. This is a stopgap until the columns
   (elig_min_cibil, elig_invite_only, …) land in Supabase — at
   which point scoreCard() can read them off the card directly.
   ============================================================ */

import { I18N } from './core.js';

/* ---------- i18n ----------
   The eligibility page wires into core.js's I18N object (en + hi populated;
   ta/te fall back to English, same as t() in core.js). t is private there, so
   we re-implement the identical lookup against the exported I18N. */
export function t(lang, key) {
  return (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
}

/* ---------- option vocabularies (shared by page + scoring) ----------
   Option VALUES are stable, language-independent keys (used for state + the
   scoring map). Display text comes from a translation key (tkey) via t(). */
export const EMPLOYMENT = [
  ['salaried', 'elig_emp_salaried'],
  ['self_employed', 'elig_emp_self'],
  ['business', 'elig_emp_business'],
  ['home_maker', 'elig_emp_homemaker'],
  ['student', 'elig_emp_student'],
  ['retired', 'elig_emp_retired'],
];

// [value, monthly midpoint (for scoring), tkey (display)]
export const INCOME_BANDS = [
  ['u20', 15000, 'elig_income_u20'],
  ['20_40', 30000, 'elig_income_20_40'],
  ['40_60', 50000, 'elig_income_40_60'],
  ['60_80', 70000, 'elig_income_60_80'],
  ['80_1l', 90000, 'elig_income_80_1l'],
  ['1l_15l', 125000, 'elig_income_1l_15l'],
  ['15l_2l', 175000, 'elig_income_15l_2l'],
  ['above_2l', 250000, 'elig_income_above_2l'],
];

// key → { mid, color, ntc, labelKey, rangeKey, descKey }
export const CIBIL_BANDS = [
  ['below_650', { mid: 625, color: '#dc2626', labelKey: 'elig_cibil_below650_label', rangeKey: 'elig_cibil_below650_range', descKey: 'elig_cibil_below650_desc' }],
  ['650_699', { mid: 675, color: '#d97706', labelKey: 'elig_cibil_650_label', rangeKey: 'elig_cibil_650_range', descKey: 'elig_cibil_650_desc' }],
  ['700_749', { mid: 725, color: '#16a34a', labelKey: 'elig_cibil_700_label', rangeKey: 'elig_cibil_700_range', descKey: 'elig_cibil_700_desc' }],
  ['750_plus', { mid: 775, color: '#4d7c0f', labelKey: 'elig_cibil_750_label', rangeKey: 'elig_cibil_750_range', descKey: 'elig_cibil_750_desc' }],
  ['ntc', { mid: 0, color: '#6b7280', ntc: true, labelKey: 'elig_cibil_ntc_label', rangeKey: 'elig_cibil_ntc_range', descKey: 'elig_cibil_ntc_desc' }],
];

// City names are proper nouns — kept English/Romanized in both languages.
export const CITIES = [
  ['Mumbai', 'metro'], ['Delhi / NCR', 'metro'], ['Bengaluru', 'metro'],
  ['Chennai', 'metro'], ['Hyderabad', 'metro'], ['Pune', 'metro'],
  ['Other metro', 'metro'], ['Tier-2 / smaller city', 'tier2'],
];

// Q5 — bank relationship. value is the canonical bank key matched against card.bank.
// Bank names stay English/Romanized (proper nouns); only 'None' is translated
// (tkey elig_bank_none) — handled in the page renderer.
export const BANK_OPTIONS = [
  ['HDFC', 'HDFC Bank'], ['ICICI', 'ICICI Bank'], ['Axis', 'Axis Bank'],
  ['SBI', 'SBI'], ['Kotak', 'Kotak'], ['IDFC', 'IDFC FIRST'],
  ['IndusInd', 'IndusInd'], ['none', 'None'],
];

/* ---------- bank visual + domain metadata (mirrors core.js BANKMETA) ---------- */
export const BANKMETA = {
  'HDFC': ['HDFC', '#004C8F'], 'Axis': ['AXIS', '#97144D'], 'SBI': ['SBI', '#22409A'],
  'ICICI': ['ICICI', '#AE282E'], 'American Express': ['AMEX', '#1F6FB2'], 'Kotak': ['KOTAK', '#C8102E'],
  'IndusInd': ['INDUS', '#9B1B30'], 'RBL Bank': ['RBL', '#C20E2A'], 'IDFC': ['IDFC', '#9B1B30'],
  'Bank of Baroda': ['BOB', '#F26A21'], 'Federal Bank': ['FEDERAL', '#003D7A'], 'Yes': ['YES', '#00518F'],
  'YES Bank': ['YES', '#00518F'], 'SBM': ['SBM', '#1A7A5E'], 'SBM Bank': ['SBM', '#1A7A5E'],
};
// Resolve [mono, color] for any bank name (exact, then prefix match, else fallback).
export function bankMeta(bank) {
  if (BANKMETA[bank]) return BANKMETA[bank];
  const k = Object.keys(BANKMETA).find(key => (bank || '').toLowerCase().startsWith(key.toLowerCase()));
  return k ? BANKMETA[k] : [String(bank || '').slice(0, 5).toUpperCase(), '#10131a'];
}
// token that should appear in the bank's OWN apply domain
const BANK_DOMAIN_TOKEN = {
  'HDFC': 'hdfc', 'Axis': 'axis', 'SBI': 'sbicard', 'ICICI': 'icici',
  'American Express': 'americanexpress', 'Kotak': 'kotak', 'IndusInd': 'indusind',
  'RBL Bank': 'rbl', 'IDFC': 'idfc', 'Bank of Baroda': 'bobcard', 'Federal Bank': 'federal',
  'YES Bank': 'yes', 'Yes': 'yes', 'SBM Bank': 'sbm', 'SBM': 'sbm',
};

/* ---------- static eligibility map (slug → synthetic attributes) ---------- */
// employment[] = accepted employment keys. minIncome is monthly (INR).
export const ELIG = {
  // — super premium —
  'amex-american-express-platinum-card': { minAge: 21, maxAge: 65, minCibil: 750, minIncome: 150000, employment: ['salaried', 'self_employed', 'business'], metroOnly: true, inviteOnly: false, securedAvailable: false },
  'hdfc-infinia-metal-edition': { minAge: 21, maxAge: 65, minCibil: 800, minIncome: 250000, employment: ['salaried', 'self_employed', 'business'], metroOnly: true, inviteOnly: true, securedAvailable: false },
  'axis-magnus-credit-card': { minAge: 21, maxAge: 70, minCibil: 730, minIncome: 100000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  // — premium —
  'axis-axis-bank-atlas-credit-card': { minAge: 18, maxAge: 70, minCibil: 710, minIncome: 75000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'sbi-sbi-card-elite': { minAge: 18, maxAge: 70, minCibil: 700, minIncome: 60000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'hdfc-regalia-gold': { minAge: 21, maxAge: 70, minCibil: 720, minIncome: 60000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'hdfc-tata-neu-infinity-hdfc-bank': { minAge: 21, maxAge: 65, minCibil: 720, minIncome: 50000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'icici-icici-bank-sapphiro-credit-card': { minAge: 21, maxAge: 65, minCibil: 720, minIncome: 60000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'sbi-sbi-card-prime': { minAge: 18, maxAge: 70, minCibil: 700, minIncome: 50000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'federal-celesta': { minAge: 21, maxAge: 65, minCibil: 700, minIncome: 40000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  // — mid tier —
  'amex-american-express-gold-card': { minAge: 18, maxAge: 65, minCibil: 700, minIncome: 55000, employment: ['salaried', 'self_employed', 'business'], metroOnly: true, inviteOnly: false, securedAvailable: false },
  'federal-imperio': { minAge: 21, maxAge: 65, minCibil: 690, minIncome: 35000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'rbl-platinum-maxima': { minAge: 18, maxAge: 65, minCibil: 680, minIncome: 30000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  // — entry / mainstream —
  'sbi-irctc-sbi-card': { minAge: 18, maxAge: 70, minCibil: 670, minIncome: 25000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'axis-flipkart-axis-bank-credit-card': { minAge: 18, maxAge: 70, minCibil: 680, minIncome: 25000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'sbi-cashback-sbi-card': { minAge: 18, maxAge: 70, minCibil: 700, minIncome: 30000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'axis-my-zone-credit-card': { minAge: 18, maxAge: 70, minCibil: 660, minIncome: 20000, employment: ['salaried', 'self_employed', 'business', 'student'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  'sbi-bpcl-sbi-card': { minAge: 18, maxAge: 70, minCibil: 670, minIncome: 20000, employment: ['salaried', 'self_employed', 'business'], metroOnly: false, inviteOnly: false, securedAvailable: false },
  // — secured fallback —
  'sbm-sbm-zet': { minAge: 18, maxAge: 75, minCibil: 0, minIncome: 0, employment: ['salaried', 'self_employed', 'business', 'home_maker', 'student', 'retired'], metroOnly: false, inviteOnly: false, securedAvailable: true },
};

export const SECURED_FALLBACK_SLUG = 'sbm-sbm-zet';

/* ---------- per-factor scorers (each returns 0–100) ---------- */
function incomeScore(income, min) {
  if (!min || income >= min) return 100;
  const ratio = income / min;
  if (ratio >= 0.8) return Math.round(50 + ((ratio - 0.8) / 0.2) * 49); // 50–99
  return 0;
}
function cibilScore(cibil, min, ntc, securedAvailable) {
  if (ntc) return securedAvailable ? 100 : 0;       // NTC only qualifies for secured
  if (!min || cibil >= min) return 100;
  if (cibil >= min - 25) return 60;
  if (cibil >= min - 50) return 30;
  return 0;
}
function employmentScore(emp, accepted) {
  if (emp === 'salaried' && accepted.includes('salaried')) return 100;
  if ((emp === 'self_employed' || emp === 'business') && (accepted.includes('self_employed') || accepted.includes('business'))) return 80;
  return 50;
}
function cityScore(cityTier, metroOnly) {
  if (metroOnly && cityTier === 'tier2') return 0;
  return 100;
}
function affiliateScore(applyUrl, bank) {
  if (!applyUrl) return 0;
  let host = '';
  try { host = new URL(applyUrl).hostname.toLowerCase(); } catch { return 50; }
  const token = BANK_DOMAIN_TOKEN[bank];
  if (token && host.includes(token)) return 100;   // bank's own domain
  return 50;                                        // third-party aggregator
}

// Core factor weights sum to 1.0 so a fully-qualifying card reaches 100% on its
// own — no bank relationship required. Income + CIBIL dominate (65%) so a card
// the applicant clearly can't get drops to a genuinely low score. Existing bank
// relationship is a separate on-top bonus (see below), not part of this 100%.
const W = { age: 0.05, income: 0.30, cibil: 0.35, employment: 0.10, city: 0.05, invite: 0.05, affiliate: 0.10 };

/* ---------- score one card. Returns {score, factors} or null if disqualified. ---------- */
export function scoreCard(card, profile) {
  const e = ELIG[card.slug];
  if (!e) return null;                              // only curated cards are scored

  // hard disqualifiers
  if (profile.age && (profile.age < e.minAge || profile.age > e.maxAge)) return null;
  if (e.inviteOnly) return null;
  if (profile.ntc && !e.securedAvailable) return null;

  const f = {
    age: 100,                                       // in-range (out-of-range already excluded)
    income: incomeScore(profile.income, e.minIncome),
    cibil: cibilScore(profile.cibil, e.minCibil, profile.ntc, e.securedAvailable),
    employment: employmentScore(profile.employment, e.employment),
    city: cityScore(profile.cityTier, e.metroOnly),
    invite: 100,
    affiliate: affiliateScore(card.apply_url, card.bank),
  };
  let score = f.age * W.age + f.income * W.income + f.cibil * W.cibil
    + f.employment * W.employment + f.city * W.city + f.invite * W.invite + f.affiliate * W.affiliate;
  // existing bank relationship: small on-top bonus (capped at 100 below)
  if (profile.bank && profile.bank !== 'none' && profile.bank === card.bank) score += 8;

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors: f };
}

/* ---------- rank the catalogue for a profile ----------
   Returns { fallback: boolean, results: [{card, score, factors, best}], reason }.
   Fallback fires when employment = home_maker OR no unsecured card scores > 0;
   it surfaces the secured card (SBM ZET) alone at 100%. */
export function rankCards(cards, profile) {
  const scored = [];
  for (const card of cards) {
    const r = scoreCard(card, profile);
    if (r && r.score > 0) scored.push({ card, ...r });
  }
  const unsecured = scored.filter(s => s.card.type !== 'secured');
  const fallback = profile.employment === 'home_maker' || unsecured.length === 0;

  if (fallback) {
    const zet = cards.find(c => c.slug === SECURED_FALLBACK_SLUG);
    const results = zet ? [{ card: zet, score: 100, factors: null, best: true, forcedSecured: true }] : [];
    return { fallback: true, results, reason: profile.employment === 'home_maker' ? 'home_maker' : 'no_unsecured' };
  }

  unsecured.sort((a, b) => b.score - a.score);
  if (unsecured[0]) unsecured[0].best = true;
  return { fallback: false, results: unsecured, reason: null };
}
