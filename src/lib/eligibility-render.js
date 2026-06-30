/* ============================================================
   Card Gyani — shared eligibility render helpers (elig_2.0).
   The odds-tab bar and the approval-ring / bank-logo markup are
   shared between the main /eligibility page and the full
   /eligibility/results page so the two stay identical.
   ============================================================ */
import { bankMeta, t } from './eligibility.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RING_R = 22;
const C = 2 * Math.PI * RING_R;

export function ringColors(pct) {
  if (pct >= 50) return { arc: '#84cc16', text: '#4d7c0f' };
  if (pct >= 25) return { arc: '#f59e0b', text: '#b45309' };
  return { arc: '#ef4444', text: '#b91c1c' };
}
export function ringHtml(pct) {
  const { arc, text } = ringColors(pct);
  const off = C * (1 - pct / 100);
  return `<div class="res-ring">
    <svg width="52" height="52" viewBox="0 0 52 52" style="transform:rotate(-90deg)">
      <circle cx="26" cy="26" r="${RING_R}" fill="none" stroke="#e6e8e3" stroke-width="4"></circle>
      <circle cx="26" cy="26" r="${RING_R}" fill="none" stroke="${arc}" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"></circle>
    </svg>
    <span class="ring-pct" style="color:${text}">${pct}%</span>
  </div>`;
}

export function logoHtml(bank) {
  const [mono, color] = bankMeta(bank);
  return `<span class="res-logo" style="background:${color}">${esc(mono)}</span>`;
}

/* ---------- odds-filter tab bar (Likely / Possible / Unlikely) ---------- */
const TAB_DEFS = [['likely', 'Likely'], ['possible', 'Possible'], ['unlikely', 'Unlikely']];
export function tabsHtml(counts, activeTab) {
  return `<div class="res-tabs" role="tablist">${TAB_DEFS.map(([id, label]) =>
    `<button type="button" role="tab" aria-selected="${activeTab === id}" class="res-tab ${id}${activeTab === id ? ' sel' : ''}" data-tab="${id}">${label} · ${counts[id] || 0}</button>`
  ).join('')}</div>`;
}

/* ---------- compact result row (full list on the results page) ---------- */
function applyHref(c) { return c.affiliate_url || c.apply_url || '#'; }
export function rowHtml(lang, r) {
  const c = r.card;
  const sub = `${esc(c.bank)} · ${esc(t(lang, c.cat))}`;
  return `<article class="res-row">
    ${logoHtml(c.bank)}
    <div class="res-id"><div class="res-name"><a href="/cards/${esc(c.slug)}">${esc(c.name)}</a></div><div class="res-sub">${sub}</div></div>
    ${ringHtml(r.score)}
    <div class="res-row-actions">
      <a class="res-btn res-view" href="/cards/${esc(c.slug)}">Details</a>
      <a class="res-btn res-apply" href="${esc(applyHref(c))}" target="_blank" rel="noopener noreferrer nofollow" data-ev="apply_click" data-card="${esc(c.slug)}" data-bank="${esc(c.bank)}">Apply <i class="ti ti-external-link"></i></a>
    </div>
  </article>`;
}
