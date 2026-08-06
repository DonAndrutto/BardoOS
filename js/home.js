// The doorway, and the list of what can be read.
//
// Opening the app lands on the home screen: two ways in and nothing
// else to decide at 3 a.m. — the available texts, or the Introduction.
// Both pages are instrument chrome, not content: every text title on
// them is read from the manifest (the owner's words), never authored
// here. The shape of the cycle stays legible (BRIEF §4) — the texts
// page names the bardo each pointing-out belongs to.

import { cycleEntry, deitiesOfClass, deityDays, deitiesForDay, deityTiles } from './data.js';
import { t } from './i18n.js';

const TODO = 'TODO_CONTENT';
const INTRO_ID = 'guide.introduction';

// Prayers stand as a collection of their own in the manifest; every
// other group of readable texts is a pointing-out on one of the bardos,
// so the two groups on the page are "Introductions" and "Prayers".
// The Guide (this Introduction, How to Use) is the instrument's own
// material, not a text of the cycle: it has its own door on the home
// screen and is not listed here.
const PRAYER_GROUPS = new Set(['prayers-liturgies']);
const SKIP_GROUPS = new Set(['guide']);

// Static icon markup only — never content (the discipline of the nav
// and the renderer).
const ARROW_ICON =
  '<svg class="text-entry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

// A text's title as the manifest gives it; the id is the honest
// fallback while a title is still TODO_CONTENT (as in the nav).
function titleOf(entry) {
  return entry.title !== TODO ? entry.title : entry.id;
}

// The reading surface is shared with the text renderer, which leaves
// per-text hooks on it for CSS scoping. A doorway page is no text.
function reset(container) {
  container.textContent = '';
  delete container.dataset.textId;
  delete container.dataset.kind;
  delete container.dataset.cycle;
}

// What can actually be read right now, in manifest order, in the two
// groups the page shows. Forthcoming texts are the sidebar's business —
// this page lists only what opens.
export function availableTexts(cycle) {
  const introductions = [];
  const prayers = [];
  for (const group of cycle.groups) {
    if (SKIP_GROUPS.has(group.id)) continue;
    for (const entry of group.texts) {
      if (entry.status !== 'translated') continue;
      const into = PRAYER_GROUPS.has(group.id) ? prayers : introductions;
      into.push({ id: entry.id, title: titleOf(entry), context: group.heading.en });
    }
  }
  return { introductions, prayers };
}

function option(list, { label, note, attr, value }) {
  const li = el('li', null, list);
  const btn = el('button', 'home-option', li);
  btn.type = 'button';
  btn.dataset[attr] = value;
  const body = el('span', 'home-option-body', btn);
  el('span', 'home-option-title', body).textContent = label;
  el('span', 'home-option-note', body).textContent = note;
  btn.insertAdjacentHTML('beforeend', ARROW_ICON);
  return btn;
}

// ── The home screen: two doors ──────────────────────────────────────
export function renderHome(container) {
  reset(container);
  const home = el('div', 'home', container);
  const list = el('ul', 'home-options', home);

  option(list, {
    label: t('availableTexts'),
    note: t('availableTextsNote'),
    attr: 'go',
    value: 'texts',
  });

  // The Introduction's own name comes from the manifest, like every
  // other text's; the label here falls back to it only if it is gone.
  const intro = cycleEntry(INTRO_ID);
  option(list, {
    label: intro ? titleOf(intro) : t('introduction'),
    note: t('introductionNote'),
    attr: 'openText',
    value: INTRO_ID,
  });
}

function textGroup(container, heading, items, withContext) {
  if (!items.length) return;
  const sec = el('section', 'section', container);
  el('h2', 'section-heading', sec).textContent = heading;
  const list = el('ul', 'text-list', sec);
  for (const item of items) {
    const li = el('li', null, list);
    const btn = el('button', 'text-entry', li);
    btn.type = 'button';
    btn.dataset.openText = item.id;
    const body = el('span', 'text-entry-body', btn);
    if (withContext && item.context) {
      el('span', 'text-entry-context', body).textContent = item.context;
    }
    el('span', 'text-entry-title', body).textContent = item.title;
    btn.insertAdjacentHTML('beforeend', ARROW_ICON);
  }
}

// ── The deity gallery (BRIEF §7) ────────────────────────────────────
// The roster as figures, grouped by the day each dawns — which is the
// shape the day-cluster view will want too. Names here are the owner's
// own file labels, at their direction; the passages keep their own
// spellings. Couples in union share one image and one tile.
function deityTile(list, parent) {
  const first = list[0];
  const btn = el('button', 'deity-tile', parent);
  btn.type = 'button';
  btn.dataset.deityRef = first.id;
  const names = list.map((d) => d.en || d.sa || d.id);
  const img = el('img', 'deity-tile-image', btn);
  img.src = first.image;
  img.alt = names.join(' · ');
  img.loading = 'lazy';
  img.decoding = 'async';
  const label = el('span', 'deity-tile-name', btn);
  for (const n of names) el('span', 'line', label).textContent = n;
  return btn;
}

export function renderDeities(container, cls) {
  reset(container);
  const title = el('header', 'text-title page-title', container);
  el('div', 'en', title).textContent = t('peacefulDeities');

  const roster = deitiesOfClass(cls).filter((d) => d.image);
  if (!roster.length) {
    el('p', 'block layer-L0', container).textContent = t('noDeitiesYet');
    return;
  }
  for (const day of deityDays(cls)) {
    const on = deitiesForDay(day).filter((d) => d.image && d.class === cls);
    if (!on.length) continue;
    const sec = el('section', 'section', container);
    el('h2', 'section-heading', sec).textContent = `${t('dayOfDharmata')} ${day}`;
    const grid = el('div', 'deity-grid', sec);
    for (const tile of deityTiles(on)) deityTile(tile, grid);
  }
}

// ── The list of available texts ─────────────────────────────────────
export function renderTexts(container, cycle) {
  reset(container);
  const title = el('header', 'text-title page-title', container);
  el('div', 'en', title).textContent = t('availableTexts');

  const { introductions, prayers } = availableTexts(cycle);
  if (!introductions.length && !prayers.length) {
    el('p', 'block layer-L0', container).textContent = t('noTextsYet');
    return;
  }
  // The bardo each pointing-out belongs to is worth naming; under
  // "Prayers" the group would only repeat the heading.
  textGroup(container, t('introductions'), introductions, true);
  textGroup(container, t('prayers'), prayers, false);
}
