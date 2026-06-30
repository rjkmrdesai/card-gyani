/* ============================================================
   Card Gyani — eligibility share/URL codec (elig_2.0, additive).
   Encodes the user's 5 inputs + active tab into a base64 URL
   payload and back, and rebuilds the scoring `profile` from a
   decoded payload. Reuses the vocab + scoring from eligibility.js
   (scoring logic itself is NOT modified here).
   ============================================================ */
import { INCOME_BANDS, CIBIL_BANDS, CITIES } from './eligibility.js';

/* ---------- internal value  ⇄  shareable URL token ---------- */
const INCOME_TO = { u20: '0-20', '20_40': '20-40', '40_60': '40-60', '60_80': '60-80', '80_1l': '80-100', '1l_15l': '100-150', '15l_2l': '150-200', above_2l: '200+' };
const CIBIL_TO = { below_650: '300-649', '650_699': '650-699', '700_749': '700-749', '750_plus': '750-900', ntc: 'ntc' };
const CITY_TO = { 'Mumbai': 'mumbai', 'Delhi / NCR': 'delhi-ncr', 'Bengaluru': 'bengaluru', 'Chennai': 'chennai', 'Hyderabad': 'hyderabad', 'Pune': 'pune', 'Other metro': 'other-metro', 'Tier-2 / smaller city': 'tier2' };
const BANK_TO = { HDFC: 'hdfc', ICICI: 'icici', Axis: 'axis', SBI: 'sbi', Kotak: 'kotak', IDFC: 'idfc', IndusInd: 'indusind', none: 'none' };
const invert = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const INCOME_FROM = invert(INCOME_TO), CIBIL_FROM = invert(CIBIL_TO), CITY_FROM = invert(CITY_TO), BANK_FROM = invert(BANK_TO);

/* ---------- url-safe base64 (handles unicode) ---------- */
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(s) {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)));
}

const TABS = ['likely', 'possible', 'unlikely'];

/* ---------- encode the in-memory state (internal values) ---------- */
export function encodeState(state, activeTab) {
  const inputs = {
    age: state.age ? Number(state.age) : null,
    monthlyIncomeRange: state.income ? (INCOME_TO[state.income] || null) : null,
    employmentType: state.employment || null,
    cibilRange: state.cibil ? (CIBIL_TO[state.cibil] || null) : null,
    city: state.city ? (CITY_TO[state.city] || null) : null,
    existingBank: state.bank ? (BANK_TO[state.bank] || null) : null,
  };
  const payload = { v: 1, inputs, activeTab: TABS.includes(activeTab) ? activeTab : 'likely' };
  return b64encode(JSON.stringify(payload));
}

/* ---------- decode → { inputs (internal), contract, activeTab } or null ---------- */
export function decodeState(s) {
  if (!s) return null;
  try {
    const json = JSON.parse(b64decode(s));
    if (!json || json.v !== 1 || !json.inputs) return null;
    const i = json.inputs;
    const inputs = {
      age: i.age != null ? String(i.age) : '',
      income: i.monthlyIncomeRange ? (INCOME_FROM[i.monthlyIncomeRange] || null) : null,
      employment: i.employmentType || null,
      cibil: i.cibilRange ? (CIBIL_FROM[i.cibilRange] || null) : null,
      city: i.city ? (CITY_FROM[i.city] || null) : null,
      bank: i.existingBank ? (BANK_FROM[i.existingBank] || null) : null,
    };
    return { inputs, contract: i, activeTab: TABS.includes(json.activeTab) ? json.activeTab : 'likely' };
  } catch (e) {
    return null;
  }
}

/* ---------- re-encode an already-decoded payload with a new active tab ---------- */
export function recodeTab(decoded, activeTab) {
  const payload = { v: 1, inputs: decoded.contract, activeTab: TABS.includes(activeTab) ? activeTab : 'likely' };
  return b64encode(JSON.stringify(payload));
}

/* ---------- rebuild the scoring profile from decoded inputs ---------- */
const INCOME_MID = Object.fromEntries(INCOME_BANDS.map(([v, mid]) => [v, mid]));
const CIBIL_MAP = Object.fromEntries(CIBIL_BANDS);
const CITY_TIER = Object.fromEntries(CITIES);

export function buildProfile(inputs) {
  const cb = inputs.cibil ? CIBIL_MAP[inputs.cibil] : null;
  return {
    employment: inputs.employment,
    income: inputs.income ? (INCOME_MID[inputs.income] || 0) : 0,
    cibil: cb ? cb.mid : 0,
    ntc: !!(cb && cb.ntc),
    age: inputs.age ? Number(inputs.age) : 0,
    cityTier: inputs.city ? CITY_TIER[inputs.city] : null,
    bank: inputs.bank,
  };
}

export function isReady(inputs) {
  return !!(inputs && inputs.employment && inputs.income && inputs.cibil);
}

/* ---------- band classification (shared by both pages) ---------- */
export function bandOf(score) {
  return score >= 50 ? 'likely' : score >= 25 ? 'possible' : 'unlikely';
}
// id, label, bg, text — colours match the per-band tab tint in the spec.
export const BANDS = [
  ['likely', 'Likely', '#eaf5d4', '#4d7c0f'],
  ['possible', 'Possible', '#fef3c7', '#b45309'],
  ['unlikely', 'Unlikely', '#fee2e2', '#b91c1c'],
];

export function bandCounts(results) {
  const c = { likely: 0, possible: 0, unlikely: 0 };
  results.forEach(r => { c[bandOf(r.score)]++; });
  return c;
}
