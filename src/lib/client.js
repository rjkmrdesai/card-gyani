/* ============================================================
   Browser entry. Hydrates the page with the same render core
   used at build time, then runs the prototype's interactivity:
   filters, sort, search, language, compare (persisted), drawer.
   Cross-page navigation uses real <a href> links (full loads);
   compare selection + language persist via localStorage.
   ============================================================ */
import * as core from './core.js';

const LS_CMP = 'cg_compare';
const LS_LANG = 'cg_lang';
const $ = id => document.getElementById(id);

const CARDS = window.__CARDS__ || [];
const BANKS = window.__BANKS__ || [];
const INIT = window.__INIT__ || { route: 'home' };
core.configure(CARDS, BANKS);

// ---- analytics: one helper, fans out to GA4 (gtag). No-op until PUBLIC_GA_ID is set. ----
function track(name, props) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, props || {}); } catch {}
}
let _searchT;
function trackSearch(q) {              // debounced so we log intent, not keystrokes
  clearTimeout(_searchT);
  _searchT = setTimeout(() => { const v = (q || '').trim(); if (v.length >= 2) track('search', { query: v.slice(0, 60) }); }, 800);
}

function loadCompare() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_CMP) || '[]');
    return Array.isArray(v) ? v.filter(id => CARDS.some(c => c.id === id)).slice(0, 4) : [];
  } catch { return []; }
}
function saveCompare() { try { localStorage.setItem(LS_CMP, JSON.stringify(S.compare)); } catch {} }
function loadLang() {
  // 1. ?lang= URL param — ad campaigns set this explicitly per audience
  try {
    const p = new URLSearchParams(window.location.search).get('lang');
    if (p && core.LANGS[p]) {
      try { localStorage.setItem(LS_LANG, p); } catch {}
      return p;
    }
  } catch {}
  // 2. localStorage — returning user's saved choice
  try {
    const saved = localStorage.getItem(LS_LANG);
    if (saved && core.LANGS[saved]) return saved;
  } catch {}
  // 3. Browser/OS language — auto-detect for first-time organic visitors
  const nav = ((navigator.language || '').slice(0, 2)).toLowerCase();
  const BROWSER_MAP = { hi: 'hi', ta: 'ta', te: 'te' };
  if (BROWSER_MAP[nav]) return BROWSER_MAP[nav];
  // 4. Fallback to English
  return INIT.lang || 'en';
}

// ---- state ----
const over = { route: INIT.route, lang: loadLang() };
if (INIT.route === 'detail') over.detailSlug = INIT.slug;
const S = core.defaultState(over);
S.compare = loadCompare();
if (INIT.catPage) { S.catPage = INIT.catPage; S.f.cat.add(INIT.catPage); }

// ---- render ----
function render() {
  core.setState(S);
  const app = $('app');
  if (app) app.innerHTML = core.viewFor();
  // compare tray
  const tray = $('tray');
  if (tray) { const tr = core.trayHTML(); tray.className = tr.cls; tray.innerHTML = tr.html; }
  // mobile drawer mirrors filters (keep open/closed class)
  const drawer = $('drawer');
  if (drawer) {
    const open = drawer.classList.contains('show');
    drawer.innerHTML = core.drawerHTML();
    if (open) drawer.classList.add('show');
  }
  saveCompare();
  try { localStorage.setItem(LS_LANG, S.lang); } catch {}
  document.documentElement.lang = S.lang;
  if (S.route === 'home') initHomeFx();
}

let CG_STATS_DONE=false;
export function initHomeFx(){
  if(CG_STATS_DONE) return;
  const band=document.getElementById('statband'); if(!band) return;
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){CG_STATS_DONE=true;return;}
  const nums=band.querySelectorAll('.statnum[data-target]');
  nums.forEach(el=>{el.textContent='0'+(el.dataset.suffix||'');});
  new IntersectionObserver((ents,obs)=>{ents.forEach(en=>{ if(!en.isIntersecting) return;
    CG_STATS_DONE=true; obs.disconnect();
    nums.forEach(el=>{const tg=+el.dataset.target,suf=el.dataset.suffix||'',t0=performance.now();
      (function s(n){const p=Math.min(1,(n-t0)/1200),e=1-Math.pow(1-p,3);el.textContent=Math.round(tg*e)+suf;p<1?requestAnimationFrame(s):el.textContent=tg+suf;})(performance.now());});
  });},{threshold:.4}).observe(band);
}

// ---- toast ----
let toastTimer;
function toast(msg) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

// ---- actions (exposed globally for inline handlers) ----
function toggleFilter(name, val) {
  const set = S.f[name];
  const on = !set.has(val);
  on ? set.add(val) : set.delete(val);
  if (name === 'cat') S.catPage = null; // user took manual control of category filter
  track('filter_apply', { filter: name, value: val, on });
  render();
}
function resetFilters() { Object.values(S.f).forEach(s => s.clear()); S.catPage = null; render(); }
function setSort(k) { S.sort = k; S.sortOpen = false; track('sort_change', { sort: k }); render(); }
function setLang(l) { S.lang = l; S.langOpen = false; track('lang_change', { lang: l }); render(); }
function setHomeCat(id) { S.homeCat = id; track('category_select', { category: id, place: 'home' }); render(); }
function setHomeQ(v, caret) {
  S.homeQ = v; trackSearch(v); render();
  const el = $('homeSearch');
  if (el) { el.focus(); if (caret != null) { try { el.setSelectionRange(caret, caret); } catch {} } }
}
function toggleCompare(id) {
  const i = S.compare.indexOf(id);
  if (i >= 0) { S.compare.splice(i, 1); track('compare_remove', { card: id }); }
  else { if (S.compare.length >= 4) { toast(core.I18N[S.lang]?.max4 || 'You can compare up to 4 cards'); return; } S.compare.push(id); track('compare_add', { card: id }); }
  render();
}
function clearCompare() { S.compare = []; render(); }
function openDrawer() { $('drawer')?.classList.add('show'); $('backdrop')?.classList.add('show'); }
function closeDrawer() { $('drawer')?.classList.remove('show'); $('backdrop')?.classList.remove('show'); }

Object.assign(window, {
  S, render, toggleFilter, resetFilters, setSort, setLang, setHomeCat, setHomeQ,
  toggleCompare, clearCompare, openDrawer, closeDrawer,
});

// ---- global wiring ----
document.addEventListener('click', e => {
  const evEl = e.target.closest('[data-ev]');   // apply_click / view_details / compare_view
  if (evEl) { const p = { ...evEl.dataset }; const name = p.ev; delete p.ev; track(name, p); }
  if (!e.target.closest('.lang') && S.langOpen) { S.langOpen = false; render(); }
  if (!e.target.closest('.sortsel') && S.sortOpen) { S.sortOpen = false; render(); }
});
$('backdrop')?.addEventListener('click', closeDrawer);

// detail-page view (the bank pageview is also logged by GA automatically)
if (INIT && (INIT.route === 'detail' || INIT.route === 'card') && INIT.slug) {
  track('card_detail_view', { card: INIT.slug });
}

// initial hydrate
render();
