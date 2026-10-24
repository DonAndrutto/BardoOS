// The doorway, and the list of what can be read.
//
// Opening the app lands on the home screen: a landing page that says
// what this is in the owner's own words, offers the two ways in that
// matter at 3 a.m. — the Introduction and How to Use — and lays the
// whole cycle out beneath them, bardo by bardo, so its shape is legible
// at a glance (BRIEF §4). Every title on it is read from the manifest
// and every sentence of welcome from the Introduction itself; nothing
// here is content authored in code. Nothing on it moves (BRIEF §9).

import {
  cycleEntry, deityCollections, depictionDeities, plateSets, loadText,
} from './data.js';
import { t } from './i18n.js';

const TODO = 'TODO_CONTENT';
const INTRO_ID = 'guide.introduction';
const HOW_TO_ID = 'guide.how-to-use';

// Prayers stand as a collection of their own in the manifest; every
// other group of readable texts is a pointing-out on one of the bardos.
// The Guide (the Introduction, How to Use) is the instrument's own
// material: it has its own doors on the home screen. Iconography holds
// pictures rather than texts, and has its own shelf on the page.
const PRAYER_GROUPS = new Set(['prayers-liturgies']);
const SKIP_GROUPS = new Set(['guide', 'iconography']);

// The same address the header's Donate link goes to: change one, change
// the other (index.html says the same of the support note).
const DONATE_URL = 'https://www.paypal.com/donate/?business=JZS5LVZKPPY5J&no_recurring=0' +
  '&item_name=Help+fund+Dharma+translation+projects.&currency_code=USD';

// Static icon markup only — never content (the discipline of the nav
// and the renderer).
const ARROW_ICON =
  '<svg class="text-entry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
const LOCK_ICON =
  '<svg class="text-entry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
  '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

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

// The cycle in manifest order, as the doorway pages show it: each bardo
// with what can be read in it now and what is still being translated,
// and the prayers as a collection of their own.
export function cycleShape(cycle) {
  const bardos = [];
  let prayers = null;
  for (const group of cycle.groups) {
    if (SKIP_GROUPS.has(group.id)) continue;
    const shaped = {
      id: group.id,
      heading: group.heading.en,
      readable: [],
      forthcoming: [],
    };
    for (const entry of group.texts) {
      const into = entry.status === 'translated' ? shaped.readable : shaped.forthcoming;
      into.push({ id: entry.id, title: titleOf(entry) });
    }
    if (!shaped.readable.length && !shaped.forthcoming.length) continue;
    if (PRAYER_GROUPS.has(group.id)) prayers = shaped;
    else bardos.push(shaped);
  }
  return { bardos, prayers };
}

// One way into a text: its title, and the arrow that says it opens.
function textButton(parent, item, className = 'text-entry') {
  const btn = el('button', className, parent);
  btn.type = 'button';
  btn.dataset.openText = item.id;
  const body = el('span', 'text-entry-body', btn);
  el('span', 'text-entry-title', body).textContent = item.title;
  btn.insertAdjacentHTML('beforeend', ARROW_ICON);
  return btn;
}

function count(key, n) {
  return t(key).replace('{n}', n);
}

// ── The home screen ─────────────────────────────────────────────────
function hero(home) {
  const sec = el('section', 'landing-hero', home);
  // The mandala the app opens with, standing still now (BRIEF §9).
  const art = el('div', 'landing-mandala', sec);
  const img = el('img', null, art);
  img.src = 'assets/intro/mandala.webp';
  img.alt = '';
  img.decoding = 'async';

  const body = el('div', 'landing-hero-body', sec);
  el('p', 'landing-bo', body).textContent = t('landingBo');
  el('h2', 'landing-title', body).textContent = t('landingTitle');

  // The welcome is the Introduction's own first paragraph, read from the
  // text rather than copied here, so the two can never disagree.
  const lede = el('p', 'landing-lede', body);
  loadText(INTRO_ID).then((text) => {
    const first = text.sections?.[0]?.blocks?.find((b) => b.en && b.en !== TODO);
    if (first && lede.isConnected) lede.textContent = first.en;
  }).catch(() => {});

  const actions = el('div', 'landing-actions', body);
  const intro = cycleEntry(INTRO_ID);
  const howTo = cycleEntry(HOW_TO_ID);
  const primary = textButton(actions, {
    id: INTRO_ID, title: intro ? titleOf(intro) : t('introduction'),
  }, 'landing-action primary');
  primary.querySelector('.text-entry-title').className = 'landing-action-label';
  if (howTo) {
    const second = textButton(actions, { id: HOW_TO_ID, title: titleOf(howTo) }, 'landing-action');
    second.querySelector('.text-entry-title').className = 'landing-action-label';
  }
}

function sectionHead(parent, heading, note) {
  const head = el('header', 'landing-head', parent);
  el('h2', 'landing-heading', head).textContent = heading;
  if (note) el('p', 'landing-note', head).textContent = note;
}

// Every bardo, in the order of the cycle: those with something to read
// now as cards, and those still wholly in translation named beneath
// them — counted rather than hidden, so the whole shape stays in view.
function bardoCards(home, bardos) {
  const sec = el('section', 'landing-section', home);
  sectionHead(sec, t('bardoInstructions'), t('bardoInstructionsNote'));
  const grid = el('div', 'landing-grid', sec);
  const waiting = [];
  for (const bardo of bardos) {
    if (!bardo.readable.length) { waiting.push(bardo); continue; }
    const card = el('article', 'landing-card', grid);
    el('h3', 'landing-card-heading', card).textContent = bardo.heading;
    const list = el('ul', 'text-list', card);
    for (const item of bardo.readable) textButton(el('li', null, list), item);
    if (bardo.forthcoming.length) {
      el('p', 'landing-card-note', card).textContent = count('moreForthcoming', bardo.forthcoming.length);
    }
  }
  if (waiting.length) {
    const rest = el('div', 'landing-waiting', sec);
    el('span', 'landing-waiting-label', rest).textContent = t('stillInTranslation');
    const list = el('ul', 'landing-waiting-list', rest);
    for (const bardo of waiting) {
      const li = el('li', null, list);
      el('span', null, li).textContent = bardo.heading;
      el('span', 'landing-waiting-count', li).textContent = String(bardo.forthcoming.length);
    }
  }
  const all = el('button', 'landing-more', sec);
  all.type = 'button';
  all.dataset.go = 'texts';
  el('span', null, all).textContent = t('allTexts');
  all.insertAdjacentHTML('beforeend', ARROW_ICON);
}

function prayerCards(home, prayers) {
  if (!prayers || !prayers.readable.length) return;
  const sec = el('section', 'landing-section', home);
  sectionHead(sec, prayers.heading, t('prayersNote'));
  const list = el('ul', 'landing-grid landing-prayers', sec);
  for (const item of prayers.readable) textButton(el('li', null, list), item, 'text-entry landing-card');
}

// The pictures: the mandala the app opens with, and each shelf of the
// Iconography, shown by its own first picture.
function iconography(home) {
  const shelves = [
    ...deityCollections().map((c) => ({
      id: c.id, label: c.label, image: c.depictions[0]?.image, n: c.depictions.length,
    })),
    ...plateSets().map((s) => ({
      id: s.id, label: s.label, image: s.plates[0]?.image, n: s.plates.length,
    })),
  ].filter((s) => s.image);
  const sec = el('section', 'landing-section', home);
  sectionHead(sec, t('iconography'), t('iconographyNote'));
  const grid = el('div', 'landing-shelves', sec);
  const tile = (attrs, image, label, note) => {
    const btn = el('button', 'landing-shelf', grid);
    btn.type = 'button';
    Object.assign(btn.dataset, attrs);
    const img = el('img', null, el('span', 'landing-shelf-image', btn));
    img.src = image;
    img.alt = '';
    img.decoding = 'async';
    el('span', 'landing-shelf-label', btn).textContent = label;
    if (note) el('span', 'landing-shelf-note', btn).textContent = note;
  };
  tile({ go: 'mandala' }, 'assets/intro/mandala.webp', t('mandala'), t('mandalaNote'));
  for (const s of shelves) tile({ shelf: s.id }, s.image, s.label, count('nPictures', s.n));
}

function closing(home) {
  const foot = el('footer', 'landing-foot', home);
  el('p', null, foot).textContent = t('offeredFreely');
  const a = el('a', 'landing-donate', foot);
  a.href = DONATE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = t('helpDonate');
}

export function renderHome(container, cycle) {
  reset(container);
  const home = el('div', 'landing', container);
  hero(home);
  if (cycle) {
    const { bardos, prayers } = cycleShape(cycle);
    bardoCards(home, bardos);
    prayerCards(home, prayers);
  }
  iconography(home);
  closing(home);
}

// ── The figures (BRIEF §7) ──────────────────────────────────────────
// One tile per depiction, in the owner's numbering — 36 tiles for 42
// deities, because six pictures show a couple in union and carry both
// their names. Tapping a tile opens the same viewer a name in the text
// does. The days of dharmatā are their own shelf, below: a plate shows
// a whole arising, so it is not grouped from these figures but supplied
// as one picture.
function deityTile(depiction, parent) {
  const names = depictionDeities(depiction).map((d) => d.label).filter(Boolean);
  const btn = el('button', 'deity-tile', parent);
  btn.type = 'button';
  btn.dataset.deityRef = depiction.deityIds[0];
  const img = el('img', 'deity-tile-image', btn);
  img.src = depiction.image;
  img.alt = names.join(' · ');
  img.loading = 'lazy';
  img.decoding = 'async';
  const label = el('span', 'deity-tile-name', btn);
  for (const n of names) el('span', 'line', label).textContent = n;
  return btn;
}

// One tile per plate, in the owner's numbering, each named as the day
// its heading names it — wider than a figure's tile, because a plate is
// a whole assembly and its faces have to stay legible.
function plateTile(plate, parent) {
  const btn = el('button', 'deity-tile plate-tile', parent);
  btn.type = 'button';
  btn.dataset.plateRef = plate.id;
  const img = el('img', 'deity-tile-image', btn);
  img.src = plate.image;
  img.alt = plate.label;
  img.loading = 'lazy';
  img.decoding = 'async';
  el('span', 'deity-tile-name', btn).textContent = plate.label;
  return btn;
}

// The gallery of a shelf, headed by the manifest's own name for it, with
// its provenance beneath. Provenance belongs to the shelf, not to each
// picture, because they all share one.
function gallery(container, shelf, tiles, kind) {
  const title = el('header', 'text-title page-title', container);
  el('div', 'en', title).textContent = shelf.label;
  const sec = el('section', 'section', container);
  const grid = el('div', `deity-grid ${kind}`, sec);
  for (const tile of tiles) tile(grid);
  const credit = [shelf.attribution, shelf.license].filter(Boolean).join(' · ');
  if (credit) el('p', 'deity-collection-credit', sec).textContent = credit;
}

// `shelfId` is the entry the reader chose off the Iconography shelf; with
// none named, everything that has something to show, in manifest order.
export function renderDeities(container, shelfId = null) {
  reset(container);
  const shown = [
    ...deityCollections().map((c) => ({
      shelf: c,
      kind: 'figure-grid',
      tiles: c.depictions.map((d) => (grid) => deityTile(d, grid)),
    })),
    ...plateSets().map((s) => ({
      shelf: s,
      kind: 'plate-grid',
      tiles: s.plates.map((p) => (grid) => plateTile(p, grid)),
    })),
  ].filter((s) => !shelfId || s.shelf.id === shelfId);

  if (!shown.length) {
    const title = el('header', 'text-title page-title', container);
    el('div', 'en', title).textContent = t('figures');
    el('p', 'block layer-L0', container).textContent = t('noDeitiesYet');
    return;
  }
  for (const { shelf, tiles, kind } of shown) gallery(container, shelf, tiles, kind);
}

// ── The texts of the cycle ──────────────────────────────────────────
// The whole catalogue on the reading surface, bardo by bardo in the
// order of the cycle: what opens now, and beneath it, quietly, what is
// still being translated — the shape of the cycle, not only its
// readable half.
function textGroup(container, group) {
  const sec = el('section', 'section texts-group', container);
  el('h2', 'section-heading', sec).textContent = group.heading;
  const list = el('ul', 'text-list', sec);
  for (const item of group.readable) textButton(el('li', null, list), item);
  for (const item of group.forthcoming) {
    const row = el('div', 'text-entry locked', el('li', null, list));
    const body = el('span', 'text-entry-body', row);
    el('span', 'text-entry-title', body).textContent = item.title;
    el('span', 'text-entry-context', body).textContent = t('forthcomingShort');
    row.insertAdjacentHTML('beforeend', LOCK_ICON);
  }
}

export function renderTexts(container, cycle) {
  reset(container);
  const title = el('header', 'text-title page-title', container);
  el('div', 'en', title).textContent = t('availableTexts');

  const { bardos, prayers } = cycleShape(cycle);
  const groups = prayers ? [...bardos, prayers] : bardos;
  const readable = groups.reduce((n, g) => n + g.readable.length, 0);
  if (!readable) {
    el('p', 'block layer-L0', container).textContent = t('noTextsYet');
    return;
  }
  const forthcoming = groups.reduce((n, g) => n + g.forthcoming.length, 0);
  el('p', 'texts-summary', title).textContent =
    count('textsSummary', readable).replace('{m}', forthcoming);
  for (const group of groups) textGroup(container, group);
}
