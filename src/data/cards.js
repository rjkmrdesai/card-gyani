/* ============================================================
   Build-time data layer. Reads the Supabase `cards` + `banks`
   tables with the anon key (RLS-protected, read-only) and maps
   each DB row into the shape the render core expects.
   Memoized so the whole build does ONE round-trip.
   ============================================================ */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY — check your .env file.');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// DB category value -> canonical key used across the UI / URLs
const CAT_MAP = {
  'super-premium': 'super_premium',
  'super_premium': 'super_premium',
  'premium': 'premium',
  'mid': 'mid_tier',
  'mid-tier': 'mid_tier',
  'mid_tier': 'mid_tier',
  'entry': 'entry',
  'travel': 'travel',
  'fuel': 'fuel',
};
const normCat = v => CAT_MAP[String(v || '').toLowerCase()] || 'entry';

const num = v => (v === null || v === undefined || v === '') ? 0 : Number(v);

function mapRow(r) {
  const fee = r.is_lifetime_free ? 0 : num(r.annual_fee);
  const networks = String(r.network || '')
    .split('/').map(s => s.trim()).filter(Boolean);
  return {
    id: r.slug,                       // slug doubles as stable id
    slug: r.slug,
    bank: r.bank_name,
    name: r.card_name,
    network: r.network || '',
    networks,                         // for the network filter (multi-network strings)
    cat: normCat(r.category),
    type: r.card_type || 'retail',
    fee,
    join: num(r.joining_fee),
    waiver: r.annual_fee_waiver_spend ? num(r.annual_fee_waiver_spend) : null,
    forex: num(r.forex_markup_pct),
    finM: num(r.finance_charge_monthly_pct),
    finA: num(r.finance_charge_annual_pct),
    reward: r.reward_summary || '',
    rpct: num(r.reward_rate),
    lounge: r.lounge_access || 'Not applicable',
    ben: Array.isArray(r.benefits) ? r.benefits : [],
    badge: r.badge || '',
    feat: Array.isArray(r.features) ? r.features : [],
    cash: r.cash_advance_fee || 'As per schedule of charges',
    late: r.late_payment_fee || '—',
    apply_url: r.apply_url || '',
    ltf: !!r.is_lifetime_free,
    fuelWaiver: r.fuel_surcharge_waiver || '',
    welcome: r.welcome_benefit || '',
    minIncome: r.min_income_eligibility || '',
  };
}

let _cache = null;

export async function loadData() {
  if (_cache) return _cache;

  const [{ data: cards, error: cErr }, { data: banks, error: bErr }] = await Promise.all([
    supabase.from('cards').select('*'),
    supabase.from('banks').select('name').order('name'),
  ]);
  if (cErr) throw new Error('Supabase cards read failed: ' + cErr.message);
  if (bErr) throw new Error('Supabase banks read failed: ' + bErr.message);

  const mapped = (cards || [])
    .filter(r => r.slug)            // only rows with a slug get a URL
    .map(mapRow)
    .sort((a, b) => b.fee - a.fee); // default order: annual fee high -> low

  _cache = { cards: mapped, banks: (banks || []).map(b => b.name) };
  return _cache;
}

export async function loadCards() { return (await loadData()).cards; }
