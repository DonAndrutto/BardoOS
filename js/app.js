// Boot and controls. Guide mode shows everything in document order;
// Voice mode is the one you use when someone is dying: spoken layers
// only, large type, rubric collapsed to markers, one tap away (BRIEF §5).

import {
  loadCycle, loadText, loadDeities, cycleEntry,
  depictionFor, depictionDeities, collectionById,
  plateFor, plateSetById, iconographyShelves,
} from './data.js';
import { remember, origin, forget } from './trail.js';
import { renderHome, renderTexts, renderDeities } from './home.js';
import { UI_LANGS, UI_LANG_BY_CODE, uiLangReady, t } from './i18n.js';
import { renderText } from './render.js';
import { layout as layoutHelp, warm as warmHelp } from './help.js';
import { replayIntro } from './intro.js';
import * as scroll from './scroll.js';
import * as anchor from './anchor.js';
import * as pages from './pages.js';
import { schedule as scheduleEstimates } from './estimate.js';
import { state, set, clampFont, effectiveFontSize, FONT_STEP } from './store.js';

const TODO = 'TODO_CONTENT';
const $ = (id) => document.getElementById(id);

let currentText = null; // the loaded text JSON currently on screen
let cycle = null;       // the manifest, once loaded
let view = 'home';      // 'home' | 'texts' | 'text' — what is on the surface
let shelf = null;       // which Iconography shelf the gallery is showing

// ── Theme: a manual choice wins; otherwise follow the system ────────
// Night is the default (owner's direction, 2026-07-19): the app is for
// bedsides and small hours, so day is the explicit choice, not dark.
// The sun and the moon used to be swapped from here with two inline
// style writes. They follow `data-theme` in css/app.css now: the icon is
// a consequence of the palette rather than a second copy of it.
function applyTheme() {
  const dark = state.theme ? state.theme === 'dark' : true;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')
    .setAttribute('content', dark ? '#171412' : '#FDFBF7');
}

// ── Type size: one custom property drives every layer's scale ───────
// It goes on `body`, not on the document element. `body` is the smallest
// container that actually holds every consumer of the reader's size: the
// reading surface, and the two overlays that deliberately follow it (the
// contents sheet and the figure's name). Writing it one level lower than
// the root keeps `<html>` and the whole `:root` token layer — every
// colour, every rem, every spacing step — out of the invalidation that a
// tap on the size control causes.
//
// Size is a custom property and nothing else: no element is measured
// here, no width is set, no inline `font-size` is written over the CSS's
// relative units. The stylesheet already expresses every layer's scale
// as a multiple of this one number, so a tap changes one value and the
// cascade does the rest.
function applyFontSize() {
  document.body.style.setProperty('--size-base', effectiveFontSize() + 'px');
}

// ── Keep the reading position across any re-render or reflow ────────
// The anchoring itself is js/anchor.js: it holds the line the reader is
// actually on, not merely the scroll offset, and it converges over the
// following frames without forcing a layout inside one. Everything that
// changes what the text looks like goes through `anchorKept`.
// In page mode the same promise is kept by text rather than by line:
// the page shown afterwards is the one holding the character the reader
// was on (js/pages.js).
const anchorKept = (change) => (pages.active() ? pages.keep(change) : anchor.keep(change));
const restoreBlock = (blockId, offset) =>
  (pages.active() ? pages.toBlock(blockId) : anchor.restore(blockId, offset));

// ── The way back ────────────────────────────────────────────────────
// Shown while the reader is somewhere a cross-link sent them. The title
// is the manifest's (the owner's words); the id is the honest fallback,
// as everywhere else. The body class lets the reading surface make room
// so the bar never covers the last line.
function applyReturn() {
  const from = origin();
  const showable = Boolean(from) && view === 'text'
    && !(currentText && currentText.id === from.textId);
  document.body.classList.toggle('has-return', showable);
  $('returnBar').hidden = !showable;
  pages.queueLayout(); // the bar's height decides the page's
  if (!showable) return;
  const entry = cycleEntry(from.textId);
  const title = entry && entry.title !== TODO ? entry.title : from.textId;
  $('returnLabel').textContent = t('backTo');
  $('returnTitle').textContent = title;
  $('btnReturn').title = title;
  $('btnReturn').setAttribute('aria-label', `${t('backTo')} ${title}`);
}

function rerender() {
  const reader = $('reader');
  if (view === 'text' && currentText) {
    renderText(currentText, reader);
    buildContents();
    scheduleEstimates(reader);
    scroll.resync();
  } else if (view === 'texts' && cycle) {
    renderTexts(reader, cycle);
  } else if (view === 'deities') {
    renderDeities(reader, shelf);
  } else if (view === 'home') {
    renderHome(reader);
  }
  pages.queueLayout(); // new nodes; the page is found again by its text
}

// ── Mode ────────────────────────────────────────────────────────────
// Voice mode's chrome belongs to a text: off one it would hide the
// header, and with it the way back — so the class only lands on a text.
function applyMode() {
  document.body.classList.toggle('voice', state.mode === 'voice' && view === 'text');
  $('btnVoice').classList.toggle('active', state.mode === 'voice');
  $('btnVoice').setAttribute('aria-pressed', String(state.mode === 'voice'));
  applyFontSize();
}

// Voice mode is the one control here that really is a change of
// content: the rubric collapses to a marker and the apparatus goes
// entirely, so different things are on the page and the page is rebuilt.
function toggleMode() {
  anchorKept(() => {
    set('mode', state.mode === 'voice' ? 'guide' : 'voice');
    applyMode();
    rerender();
  });
}

// ── Layer (language) toggles — never color alone, never all off ─────
const LANGS = [
  ['btnBo', 'showBo'],
  ['btnPhon', 'showPhon'],
  ['btnEn', 'showEn'],
];

// Three classes on the reading surface, and css/app.css does the rest.
// The renderer emits every field a block carries whatever these say, so
// switching a layer costs a class change and a style pass — no DOM is
// built, no JSON is walked, no node is replaced, and the reader's own
// place in the text is a live element rather than an id to look up.
function applyLangs() {
  const reader = $('reader');
  for (const [btn, key] of LANGS) {
    $(btn).classList.toggle('active', state[key]);
    $(btn).setAttribute('aria-pressed', String(state[key]));
  }
  reader.classList.toggle('show-bo', state.showBo);
  reader.classList.toggle('show-phon', state.showPhon);
  reader.classList.toggle('show-en', state.showEn);
}

// PHO is hidden off a text that is never recited (applyPhonRelevance),
// but its setting stays on underneath. Counting it there let a reader
// turn TIB and ENG both off on an instruction, leaving only a layer that
// text does not have — a blank page at a bedside. Only a toggle the
// reader can actually see counts towards the last one standing.
function offered(key) {
  return key !== 'showPhon' || document.body.classList.contains('recited');
}

function toggleLang(key) {
  const on = LANGS.filter(([, k]) => state[k] && offered(k)).length;
  if (state[key] && on === 1) return; // the page never goes blank
  anchorKept(() => {
    set(key, !state[key]);
    applyLangs();
  });
  // A layer coming or going changes how tall the unseen portions are.
  scheduleEstimates($('reader'));
}

// Phonetics belong to the liturgical layer (SCHEMA.md §5): the PHO
// toggle only appears on liturgies and prayers — on instructions and
// guides it would be a dead control, so it goes away entirely.
function applyPhonRelevance() {
  const kind = currentText ? currentText.kind : null;
  document.body.classList.toggle('recited', kind === 'liturgy' || kind === 'prayer');
}

// ── Auto-scroll controls ────────────────────────────────────────────
// `aria-pressed` is what assistive technology reads and what CSS now
// swaps the icon on — one piece of state, not two that can disagree.
function applyPlayIcon() {
  const running = scroll.isRunning();
  $('btnPlay').classList.toggle('active', running);
  $('btnPlay').setAttribute('aria-pressed', String(running));
}

function applySpeed() {
  scroll.setSpeed(state.scrollSpeed);
}

function changeSpeed(delta) {
  set('scrollSpeed', Math.max(1, Math.min(10, state.scrollSpeed + delta)));
  applySpeed();
}

// ── Text size ───────────────────────────────────────────────────────
// One property write, and the reader's line held across the reflow it
// causes. Nothing is re-rendered: the DOM after a size change is the
// same DOM, node for node.
// A pinch in page mode steps by a single pixel, as in the Ngöndro reader.
function changeFontSize(delta, step = FONT_STEP) {
  anchorKept(() => {
    set('fontSize', clampFont(state.fontSize + delta * step));
    applyFontSize();
  });
  // The portions the browser is skipping remember a height measured at
  // the old size; pretext re-measures them at the new one, when idle.
  scheduleEstimates($('reader'));
}

// ── Reading mode: scrolled, or turned like a book's pages ───────────
// The switch keeps the reader on the same words both ways: into pages,
// the page that holds the line they were reading; back to scrolling,
// that page's first line put at the reader's line.
function toggleReadingMode() {
  const onText = view === 'text' && currentText;
  const wasPaged = pages.active();
  const held = !onText ? null
    : wasPaged ? pages.capturePageAnchor() : pages.captureScrollAnchor(anchor.line());
  scroll.stop();
  applyPlayIcon();
  anchor.abort();
  set('readingMode', state.readingMode === 'pages' ? 'scroll' : 'pages');
  pages.sync(held);
  if (wasPaged && !pages.active()) landInScroll(held);
}

function landInScroll(held) {
  const node = pages.resolve(held);
  if (!node) return;
  // Its portion is one the browser is skipping (content-visibility),
  // which reports no geometry at all; it is laid out for the one
  // measurement, and handed back to the browser once the reader is on it.
  const sec = node.closest('section[data-section-id]');
  if (sec) {
    sec.style.contentVisibility = 'visible';
    requestAnimationFrame(() => requestAnimationFrame(() => { sec.style.contentVisibility = ''; }));
  }
  const r = node.getBoundingClientRect();
  const range = held.range && held.range.startContainer.isConnected ? held.range : null;
  const at = range ? range.getBoundingClientRect().top : r.top;
  anchor.land(node, anchor.line(), r.height > 0 ? Math.max(0, Math.min(1, (at - r.top) / r.height)) : 0);
}

// ── Interface language: the master selector (Yontendzo pattern) ─────
// Governs the interface strings only — the TIB/PHO/ENG toggles below
// are a different axis (which content layers show) and stay untouched.
// English is the only interface with strings today; picking Tibetan or
// Polish records the choice and the UI falls back to English string by
// string until the owner supplies those tables (js/i18n.js).
function buildUiLangMenu() {
  const menu = $('uiLangMenu');
  menu.textContent = '';
  for (const l of UI_LANGS) {
    const li = document.createElement('li');
    li.setAttribute('role', 'menuitem');
    li.tabIndex = 0;
    li.classList.toggle('active', l.code === state.uiLang);
    const name = document.createElement('span');
    name.textContent = l.name;
    li.appendChild(name);
    if (!uiLangReady(l.code)) {
      const pending = document.createElement('small');
      pending.className = 'menu-pending';
      pending.textContent = t('interfacePending');
      li.appendChild(pending);
    }
    const pick = () => {
      setUiLang(l.code);
      closeUiLangMenu();
      $('btnUiLang').focus();
    };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
    menu.appendChild(li);
  }
}

function openUiLangMenu() {
  $('uiLangMenu').hidden = false;
  $('btnUiLang').setAttribute('aria-expanded', 'true');
}

function closeUiLangMenu() {
  $('uiLangMenu').hidden = true;
  $('btnUiLang').setAttribute('aria-expanded', 'false');
}

function applyUiLang() {
  $('uiLangCode').textContent = UI_LANG_BY_CODE[state.uiLang].label;
  $('btnUiLang').setAttribute('aria-label', t('interfaceLanguage'));
  $('btnUiLang').title = t('interfaceLanguage');
  $('btnHome').setAttribute('aria-label', t('home'));
  $('btnHome').title = t('home');
  $('btnDeityClose').setAttribute('aria-label', t('close'));
  $('btnHelp').setAttribute('aria-label', t('helpOpen'));
  $('btnHelp').title = t('helpOpen');
  $('helpOverlay').setAttribute('aria-label', t('helpOpen'));
  $('btnHelpClose').setAttribute('aria-label', t('helpDismiss'));
  $('btnPage').setAttribute('aria-label', t('pageMode'));
  $('btnPage').title = t('pageMode');
  $('btnPrevPage').setAttribute('aria-label', t('pagePrevious'));
  $('btnNextPage').setAttribute('aria-label', t('pageNext'));
  $('pageNav').setAttribute('aria-label', t('pageNavigation'));
  buildUiLangMenu();
  // Re-apply every string the app writes itself. With English the only
  // populated table this changes nothing visible — it is the mechanism
  // a future translation drops into.
  document.querySelectorAll('.nav-note').forEach((n) => {
    n.textContent = t('forthcoming');
  });
}

function setUiLang(code) {
  if (!UI_LANG_BY_CODE[code] || code === state.uiLang) return;
  set('uiLang', code);
  // document.documentElement.lang stays "en" deliberately: the rendered
  // interface is still English until a translation table exists.
  applyUiLang();
  rerender();
}

// ── Sidebar: the catalogue beside the text ──────────────────────────
// Docked and open by default on a wide screen; an overlay, closed by
// default, on a narrow one. Voice mode hides it entirely (CSS).
const desktopNav = window.matchMedia('(min-width: 64rem)');

let navOpenedAtY = 0; // where the page stood when the overlay opened

function setMenu(open) {
  document.body.classList.toggle('nav-open', open);
  $('btnMenu').setAttribute('aria-expanded', String(open));
  if (open) navOpenedAtY = window.scrollY;
}

function navIsOpen() {
  return document.body.classList.contains('nav-open');
}

// Open *over* the text (narrow screens) rather than docked beside it.
// Only the overlay gets out of the way by itself.
function navIsOverlay() {
  return navIsOpen() && !desktopNav.matches;
}

// ── Contents: jump to a major portion of the current text ───────────
// Built from the rendered sections, so Voice mode's pruning is honoured
// and placeholder (TODO_CONTENT) headings are skipped. A text with fewer
// than two real portions has nothing to select, so the control hides.
function buildContents() {
  const list = $('contentsList');
  const group = $('contentsGroup');
  list.textContent = '';
  const sections = Array.from(
    document.querySelectorAll('#reader section[data-section-id]')
  ).filter((sec) => {
    // A portion the language toggles have emptied is still in the DOM —
    // that is the point of hiding it in CSS rather than tearing it out —
    // so the list has to ask whether it is on the screen, not whether it
    // exists. `offsetParent` is null for anything display:none, and is
    // unaffected by a portion the browser is merely skipping the layout
    // of (content-visibility), which is exactly the distinction wanted.
    // In page mode every portion but the one on the page is out of the
    // layout, so page mode answers instead.
    const paged = document.documentElement.classList.contains('paged-reading');
    if (paged ? !pages.visible(sec) : sec.offsetParent === null) return false;
    const h = sec.querySelector('.section-heading');
    const label = h ? h.textContent.trim() : '';
    return label && label !== TODO;
  });
  if (sections.length < 2) {
    group.hidden = true;
    closeContents();
    return;
  }
  for (const sec of sections) {
    const li = document.createElement('li');
    li.className = 'contents-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'contents-link';
    btn.dataset.sectionId = sec.dataset.sectionId;
    btn.textContent = sec.querySelector('.section-heading').textContent.trim();
    li.appendChild(btn);
    list.appendChild(li);
  }
  group.hidden = false;
}

// The jump is instant and then converges, rather than gliding. Gliding
// was tried against the containment: a portion thirty thousand pixels
// down is reached by travelling over a dozen portions whose heights are
// estimates until the browser lays each one out, and every correction it
// makes on the way moves the destination — the glide measurably
// overshot by more than two screens. Landing and then settling is both
// correct and what BRIEF §9 asks for anyway: nothing in this app
// animates except the auto-scroll.
function jumpToSection(id) {
  if (pages.active()) { pages.toSection(id); return; }
  const sec = document.querySelector(`#reader section[data-section-id="${CSS.escape(id)}"]`);
  if (!sec) return;
  const header = document.querySelector('.app-header');
  // Header is sticky in Guide mode, hidden in Voice mode (offsetParent null).
  const offset = header && header.offsetParent !== null
    ? header.getBoundingClientRect().height + 8 : 8;
  anchor.settle(sec, offset);
}

// Where the reader is now, so the list can say so: the portion on the
// page in page mode, the last one whose heading has passed the reader's
// line when scrolling.
function currentSection() {
  if (pages.active()) return pages.currentSectionId();
  let id = null;
  const line = anchor.line() + 1;
  for (const sec of document.querySelectorAll('#reader section[data-section-id]')) {
    if (sec.offsetParent === null) continue;
    if (sec.getBoundingClientRect().top > line) break;
    id = sec.dataset.sectionId;
  }
  return id;
}

function openContents() {
  buildContents();
  if ($('contentsGroup').hidden) return; // nothing to show
  const here = currentSection();
  $('contentsList').querySelectorAll('.contents-link').forEach((link) => {
    const current = link.dataset.sectionId === here;
    link.classList.toggle('is-current', current);
    if (current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  $('contentsPanel').hidden = false;
  $('btnContents').setAttribute('aria-expanded', 'true');
  const first = $('contentsList').querySelector('.contents-link');
  if (first) first.focus();
}

function closeContents() {
  $('contentsPanel').hidden = true;
  $('btnContents').setAttribute('aria-expanded', 'false');
}

// ── The figures: shown without losing the place (BRIEF §7) ──────────
// A name the owner marked opens the depiction that shows that deity —
// the same picture for either half of a couple in union. The reading
// position is untouchable: the viewer is an overlay (the page beneath
// never scrolls), the auto-scroll is held while it is up, and closing
// restores both it and the focus.
let deityScrollHeld = false;
let deityOpener = null;

// One viewer for both kinds of picture: a cut-out figure, or a plate of
// a whole day's arising. `plate` says which, and the only difference it
// makes is the ground — a plate carries its own.
function showFigure({ image, labels, credit, plate = false }) {
  const img = $('deityViewerImage');
  img.src = image;
  img.alt = labels.join(' · ');
  img.classList.toggle('is-plate', plate);

  // Named as the owner names them — one line for a single figure, both
  // for a couple in union, one for a plate.
  const name = $('deityViewerName');
  name.textContent = '';
  for (const label of labels) {
    const line = document.createElement('span');
    line.className = 'deity-name-line';
    line.textContent = label;
    name.appendChild(line);
  }

  $('deityViewerCredit').textContent = credit;
  $('deityViewerCredit').hidden = !credit;

  deityOpener = document.activeElement;
  deityScrollHeld = scroll.isRunning();
  if (deityScrollHeld) { scroll.stop(); applyPlayIcon(); }
  $('deityViewer').hidden = false;
  $('btnDeityClose').focus();
}

// Provenance belongs to the collection or the set, because all its
// pictures share one.
function creditOf(holder) {
  return holder ? [holder.attribution, holder.license].filter(Boolean).join(' · ') : '';
}

function openDeity(deityId) {
  const depiction = depictionFor(deityId);
  if (!depiction) return;
  showFigure({
    image: depiction.image,
    labels: depictionDeities(depiction).map((d) => d.label).filter(Boolean),
    credit: creditOf(collectionById(depiction.collection)),
  });
}

// A day's heading, or a tile in its gallery: the plate of that whole
// arising, in the same viewer and under the same discipline.
function openPlate(plateId) {
  const plate = plateFor(plateId);
  if (!plate) return;
  showFigure({
    image: plate.image,
    labels: [plate.label].filter(Boolean),
    credit: creditOf(plateSetById(plate.set)),
    plate: true,
  });
}

function closeDeity() {
  if ($('deityViewer').hidden) return;
  $('deityViewer').hidden = true;
  if (deityScrollHeld) { scroll.start(); applyPlayIcon(); }
  deityScrollHeld = false;
  if (deityOpener && document.contains(deityOpener)) deityOpener.focus();
  deityOpener = null;
}

// ── What the controls do (owner's direction, 2026-08-14) ────────────
// Nearly every control in this app is an icon. The header's question
// mark names them all where they stand, over a page that steps back.
// It borrows the figures' discipline wholesale, and for the same reason
// (BRIEF §9): the auto-scroll is held while it is up, the page beneath
// never moves, and the focus goes back where it came from. It changes
// no setting and reads none — js/help.js does the measuring.
let helpScrollHeld = false;
let helpOpener = null;

function openHelp() {
  if (!$('helpOverlay').hidden) return;
  // One picture at a time: the contents sheet and the language menu are
  // put away first, so what is left on the screen is what gets named.
  closeContents();
  closeUiLangMenu();
  helpOpener = document.activeElement;
  helpScrollHeld = scroll.isRunning();
  if (helpScrollHeld) { scroll.stop(); applyPlayIcon(); }
  document.body.classList.add('help');
  // Shown before it is filled: every position in there comes from a real
  // measurement, and a hidden element measures nothing.
  $('helpOverlay').hidden = false;
  $('btnHelp').setAttribute('aria-expanded', 'true');
  layoutHelp($('helpMarks'));
  $('btnHelpClose').focus();
}

function closeHelp() {
  if ($('helpOverlay').hidden) return;
  $('helpOverlay').hidden = true;
  $('btnHelp').setAttribute('aria-expanded', 'false');
  $('helpMarks').textContent = '';
  document.body.classList.remove('help');
  if (helpScrollHeld) { scroll.start(); applyPlayIcon(); }
  helpScrollHeld = false;
  if (helpOpener && document.contains(helpOpener)) helpOpener.focus();
  helpOpener = null;
}

// ── Fullscreen: the whole screen given to the text ──────────────────
function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function applyFs() {
  const fs = Boolean(fsElement());
  document.body.classList.toggle('fs', fs);
  $('btnFs').classList.toggle('active', fs);
  $('btnFs').setAttribute('aria-pressed', String(fs));
}

function toggleFullscreen() {
  const root = document.documentElement;
  if (fsElement()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
  }
}

// ── Navigation (bare until Phase 3) ─────────────────────────────────
function note(container, message) {
  container.textContent = '';
  const p = document.createElement('p');
  p.className = 'block layer-L0';
  p.textContent = message;
  container.appendChild(p);
}

// Three things can stand on the reading surface: the doorway, the list
// of available texts, or a text. The body carries which — the bottom
// bar stands its reading controls down where there is nothing to read.
function showView(next) {
  view = next;
  document.body.dataset.view = next;
  applyMode();
  applyReturn();
  pages.sync();
}

// Leaving a text for one of the doorway pages: stop the scroll, drop
// the overlays, and let go of the text (nothing is highlighted in the
// catalogue while none is open).
function leaveText() {
  scroll.stop();
  anchor.abort(); // nothing left to hold the reader's line on
  closeContents();
  // A tap anywhere already closes it, so this is for the ways in that a
  // tap is not — a keyboard, or a link followed while it is up.
  closeHelp();
  forget(); // the doorway is a new course; the way back goes with it
  currentText = null;
  if (!desktopNav.matches) setMenu(false);
  document.querySelectorAll('.nav .nav-text[data-text-id]')
    .forEach((b) => b.classList.remove('active'));
}

function showHome() {
  leaveText();
  showView('home');
  renderHome($('reader'));
  buildContents();
  applyPhonRelevance();
  window.scrollTo(0, 0);
}

function showTexts() {
  if (!cycle) { showHome(); return; }
  leaveText();
  showView('texts');
  renderTexts($('reader'), cycle);
  buildContents();
  applyPhonRelevance();
  window.scrollTo(0, 0);
}

// `keepOrigin` is for following a cross-link — the caller has just
// recorded where the reader stood. Every other way into a text is the
// reader choosing a new course, so the way back goes. `restore` puts
// them back on the passage they left.
// The figures, off the Iconography shelf. Its own view, so the bottom
// bar's existing data-view rules stand the reading controls down. Each
// shelf entry opens its own set — the one the reader asked for, not
// every picture in the manifest at once.
function showDeities(shelfId = null) {
  leaveText();
  shelf = shelfId;
  showView('deities');
  renderDeities($('reader'), shelf);
  buildContents();
  applyPhonRelevance();
  window.scrollTo(0, 0);
}

async function openText(id, { keepOrigin = false, restore = null } = {}) {
  if (!keepOrigin && !restore) forget();
  scroll.stop();
  // The docked sidebar stays; the overlay gets out of the way.
  if (!desktopNav.matches) setMenu(false);
  closeContents();
  showView('text');
  const reader = $('reader');
  document.querySelectorAll('.nav .nav-text[data-text-id]').forEach((b) => {
    const active = b.dataset.textId === id;
    b.classList.toggle('active', active);
    if (active) {
      const cat = b.closest('.nav-cat');
      if (cat) cat.open = true; // a jumped-to text is never hidden
    }
  });
  try {
    currentText = await loadText(id);
    renderText(currentText, reader);
    buildContents();
    scheduleEstimates(reader);
    scroll.resync();
    if (pages.active()) {
      // The text is on the surface now, so page mode can take it.
      pages.sync();
      if (restore) pages.toBlock(restore.blockId); else pages.toStart();
    } else if (restore) restoreBlock(restore.blockId, restore.offset);
    else window.scrollTo(0, 0);
  } catch (err) {
    currentText = null;
    buildContents();
    note(reader, `${t('couldNotLoadText')} (${err.message}).`);
  }
  applyPhonRelevance();
  applyReturn();
}

// Back to the passage the reader left. If that text is somehow already
// on screen there is nothing to load — just put them back on the block.
function goBack() {
  const from = origin();
  if (!from) return;
  forget();
  if (currentText && currentText.id === from.textId) {
    restoreBlock(from.blockId, from.offset);
    applyReturn();
    return;
  }
  openText(from.textId, { restore: from });
}

async function boot() {
  applyTheme();
  showView('home'); // the doorway is where the app stands until told otherwise
  // Correcting the reading position while the auto-scroll is
  // deliberately carrying it would cancel the recitation out from under
  // the reader; the anchor stands down while the engine is running.
  anchor.setGuard(() => !scroll.isRunning());
  applyLangs();
  applySpeed();
  applyFontSize();

  // Controls
  $('btnPlay').addEventListener('click', () => { scroll.toggle(); applyPlayIcon(); });
  $('btnSlower').addEventListener('click', () => changeSpeed(-1));
  $('btnFaster').addEventListener('click', () => changeSpeed(1));
  $('btnVoice').addEventListener('click', toggleMode);
  $('btnTheme').addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    set('theme', dark ? 'light' : 'dark');
    applyTheme();
  });
  $('btnPage').addEventListener('click', toggleReadingMode);
  $('btnPrevPage').addEventListener('click', () => pages.turn(-1));
  $('btnNextPage').addEventListener('click', () => pages.turn(1));
  pages.init({
    text: () => view === 'text' && Boolean(currentText),
    // Whatever has the reader's attention instead of the page.
    blocked: () => !$('helpOverlay').hidden || !$('deityViewer').hidden
      || !$('contentsPanel').hidden || !$('uiLangMenu').hidden || navIsOverlay()
      || Boolean($('intro')),
    resizeText: (delta) => changeFontSize(delta, 1),
    changed: () => {},
  });
  $('btnSmaller').addEventListener('click', () => changeFontSize(-1));
  $('btnLarger').addEventListener('click', () => changeFontSize(1));
  for (const [btn, key] of LANGS) {
    $(btn).addEventListener('click', () => toggleLang(key));
  }
  scroll.onStopped(applyPlayIcon);

  // Contents selector: open the portion list; jump on pick; close on a
  // backdrop tap. (Escape is handled with the other overlays below.)
  $('btnContents').addEventListener('click', openContents);
  $('contentsPanel').addEventListener('click', (e) => {
    const link = e.target.closest('.contents-link');
    if (link) {
      closeContents();
      jumpToSection(link.dataset.sectionId);
      return;
    }
    if (!e.target.closest('.contents-sheet')) closeContents();
  });

  // Sidebar: the corner button toggles it. As an overlay (narrow
  // screens) any way out closes it; docked, it stays until toggled.
  $('btnMenu').addEventListener('click', () => setMenu(!navIsOpen()));
  // Any move toward the text dismisses the overlay: a touch on the page
  // beneath it, or a scroll of that page. pointerdown, not click —
  // iOS Safari does not deliver a click for a tap on plain prose, and a
  // drag to scroll starts here too, before a single pixel has moved.
  document.addEventListener('pointerdown', (e) => {
    if (navIsOverlay() &&
        !$('nav').contains(e.target) && !$('btnMenu').contains(e.target)) {
      setMenu(false);
    }
  });
  // Auto-scroll moves the page on its own; that is not the reader
  // reaching for the text, so it does not close anything.
  window.addEventListener('scroll', () => {
    if (navIsOverlay() && !scroll.isRunning() &&
        Math.abs(window.scrollY - navOpenedAtY) > 4) {
      setMenu(false);
    }
  }, { passive: true });
  // The deity viewer: the close button, a tap outside the sheet, or
  // Escape (handled with the other overlays below — it sits on top, so
  // it closes first).
  $('btnDeityClose').addEventListener('click', closeDeity);
  $('deityViewer').addEventListener('click', (e) => {
    if (!e.target.closest('.deity-sheet')) closeDeity();
  });

  // What the controls do: the question mark opens it, anything closes
  // it. A turn of the phone re-measures rather than leaving the labels
  // pointing at where the controls used to be.
  $('btnHelp').addEventListener('click', openHelp);
  $('btnHelpClose').addEventListener('click', closeHelp);
  for (const ev of ['resize', 'orientationchange']) {
    window.addEventListener(ev, () => {
      if (!$('helpOverlay').hidden) layoutHelp($('helpMarks'));
      // A narrower column wraps every paragraph differently, so every
      // estimate for a portion nobody has looked at is now wrong.
      scheduleEstimates($('reader'));
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Topmost first, so Escape closes what the reader is looking at.
    if (!$('helpOverlay').hidden) {
      closeHelp();
      return;
    }
    if (!$('deityViewer').hidden) {
      closeDeity();
      return;
    }
    if (!$('contentsPanel').hidden) {
      closeContents();
      $('btnContents').focus();
      return;
    }
    if (!$('uiLangMenu').hidden) {
      closeUiLangMenu();
      $('btnUiLang').focus();
      return;
    }
    if (navIsOverlay()) {
      setMenu(false);
      $('btnMenu').focus();
    }
  });
  // Crossing the breakpoint resets to that size's sensible default.
  desktopNav.addEventListener('change', (m) => setMenu(m.matches));
  setMenu(desktopNav.matches);

  // Interface-language selector (header, upper right)
  $('btnUiLang').addEventListener('click', (e) => {
    e.stopPropagation();
    if ($('uiLangMenu').hidden) openUiLangMenu(); else closeUiLangMenu();
  });
  document.addEventListener('click', (e) => {
    if (!$('langSelect').contains(e.target)) closeUiLangMenu();
  });
  applyUiLang();

  // Fullscreen (hidden where the platform can't do it, e.g. iPhone)
  const root = document.documentElement;
  if (root.requestFullscreen || root.webkitRequestFullscreen) {
    $('btnFs').addEventListener('click', toggleFullscreen);
    for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) {
      document.addEventListener(ev, () => anchorKept(applyFs));
    }
  } else {
    document.body.classList.add('no-fullscreen');
  }

  // Home: the app's name in the header is the way back to the doorway.
  $('btnHome').addEventListener('click', showHome);

  // The way back to the passage a cross-link led away from. The bar
  // lives outside the reader, so it needs its own listener; the chip in
  // the text's footer is handled by the delegated one below.
  $('btnReturn').addEventListener('click', goBack);

  // Rubric peeking in Voice mode, the doorway pages' own links, and
  // prayer cross-links — all delegated: the reader's contents
  // re-render often.
  $('reader').addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) {
      if (go.dataset.go === 'texts') showTexts(); else showHome();
      return;
    }
    const entry = e.target.closest('[data-open-text]');
    if (entry) {
      openText(entry.dataset.openText);
      return;
    }
    if (e.target.closest('[data-return]')) {
      goBack();
      return;
    }
    const link = e.target.closest('.prayer-link');
    if (link && link.dataset.prayerRef) {
      // Where the reader stood, before the link moves them. A link with
      // no block around it is the foot-of-the-prayer "Next prayer" —
      // the chain case, which trail.js keeps the deeper origin for.
      const block = link.closest('[data-block-id]');
      if (block && currentText) {
        remember(currentText.id, currentText.kind, block.dataset.blockId,
          block.getBoundingClientRect().top);
      }
      openText(link.dataset.prayerRef, { keepOrigin: true });
      return;
    }
    // A deity's name in the passage, or a tile in the gallery. Named
    // explicitly: a block may also carry data-deity-ref, and tapping its
    // prose must never summon anything.
    const figure = e.target.closest('.deity-name, .deity-tile');
    if (figure && figure.dataset.deityRef) {
      openDeity(figure.dataset.deityRef);
      return;
    }
    // A day's heading in the text, or its tile in the gallery.
    const day = e.target.closest('.section-plate, .plate-tile');
    if (day && day.dataset.plateRef) {
      openPlate(day.dataset.plateRef);
      return;
    }
    const btn = e.target.closest('.l0-marker');
    if (!btn) return;
    const wrap = btn.closest('.voice-collapsed');
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    pages.queueLayout(); // a peeked rubric lengthens the page it is on
  });

  // Navigation
  const nav = $('nav');
  const reader = $('reader');
  try {
    cycle = await loadCycle();
  } catch (err) {
    note(reader, `${t('couldNotLoadCycle')} (${err.message}).`);
    return;
  }
  if (!cycle.groups.length) {
    note(reader, t('emptyCycle'));
    return;
  }
  // Iconography, if any has been supplied: loaded before the first text
  // renders, since a plate is decided at render time. Never fatal — an
  // empty or missing manifest simply means no plates (BRIEF §7).
  await loadDeities();
  // The shape of the cycle, legible at a glance: collapsible categories,
  // every text present — readable ones clickable, forthcoming ones locked.
  // Titles come from the manifest; the id is the honest fallback while a
  // title is still TODO_CONTENT.
  const LOCK_ICON =
    '<svg class="nav-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
    '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  // Prayers & Liturgies reads as a collection of its own within the
  // cycle (owner's Phase 3 direction) — bracketed and set apart.
  const COLLECTION_GROUPS = new Set(['prayers-liturgies']);

  for (const group of cycle.groups) {
    const cat = document.createElement('details');
    cat.className = COLLECTION_GROUPS.has(group.id)
      ? 'nav-cat nav-cat-collection'
      : 'nav-cat';
    cat.open = true;
    const summary = document.createElement('summary');
    summary.textContent = group.heading.en;
    cat.appendChild(summary);

    for (const entry of group.texts) {
      const label = entry.title !== TODO ? entry.title : entry.id;
      if (entry.status === 'translated') {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'nav-text';
        b.dataset.textId = entry.id;
        b.textContent = label;
        b.title = entry.id;
        b.addEventListener('click', () => openText(entry.id));
        cat.appendChild(b);
      } else {
        const d = document.createElement('div');
        d.className = 'nav-text locked';
        d.innerHTML = LOCK_ICON; // static icon markup only — never content
        const body = document.createElement('span');
        body.className = 'nav-locked-body';
        const title = document.createElement('span');
        title.className = 'nav-locked-title';
        title.textContent = label;
        const note = document.createElement('small');
        note.className = 'nav-note';
        note.textContent = t('forthcoming');
        body.appendChild(title);
        body.appendChild(note);
        d.appendChild(body);
        cat.appendChild(d);
      }
    }
    // Iconography holds affordances, not texts: the Zhitro Mandala
    // replays the opening arising (js/intro.js), and each shelf of
    // pictures — the peaceful deities, the wrathful, the days of
    // dharmatā — opens as a gallery of its own.
    if (group.id === 'iconography') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nav-text';
      b.textContent = 'Zhitro Mandala, Liberation upon Seeing';
      b.addEventListener('click', () => {
        if (!desktopNav.matches) setMenu(false);
        replayIntro();
      });
      cat.appendChild(b);

      // One entry per shelf that has something to show, named as the
      // manifest names it.
      for (const entry of iconographyShelves()) {
        const g = document.createElement('button');
        g.type = 'button';
        g.className = 'nav-text';
        g.textContent = entry.label;
        g.addEventListener('click', () => showDeities(entry.id));
        cat.appendChild(g);
      }
    }
    nav.appendChild(cat);
  }
  // The app opens on the doorway, not on a text: two ways in, chosen by
  // the reader (owner's direction, 2026-07-30).
  showHome();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // The labels for every control, measured while nothing is happening,
  // so the question mark opens instantly the first time it is asked.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => warmHelp($('helpMarks')), { timeout: 4000 });
}

boot();
