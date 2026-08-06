// Boot and controls. Guide mode shows everything in document order;
// Voice mode is the one you use when someone is dying: spoken layers
// only, large type, rubric collapsed to markers, one tap away (BRIEF §5).

import { loadCycle, loadText, loadDeities, deityEntry, cycleEntry } from './data.js';
import { remember, origin, forget } from './trail.js';
import { renderHome, renderTexts } from './home.js';
import { UI_LANGS, UI_LANG_BY_CODE, uiLangReady, t } from './i18n.js';
import { renderText } from './render.js';
import { replayIntro } from './intro.js';
import * as scroll from './scroll.js';
import { state, set, clampFont, effectiveFontSize, FONT_STEP } from './store.js';

const TODO = 'TODO_CONTENT';
const $ = (id) => document.getElementById(id);

let currentText = null; // the loaded text JSON currently on screen
let cycle = null;       // the manifest, once loaded
let view = 'home';      // 'home' | 'texts' | 'text' — what is on the surface

// ── Theme: a manual choice wins; otherwise follow the system ────────
// Night is the default (owner's direction, 2026-07-19): the app is for
// bedsides and small hours, so day is the explicit choice, not dark.
function applyTheme() {
  const dark = state.theme ? state.theme === 'dark' : true;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')
    .setAttribute('content', dark ? '#171412' : '#FDFBF7');
  $('iconSun').style.display = dark ? 'none' : 'block';
  $('iconMoon').style.display = dark ? 'block' : 'none';
}

// ── Type size: one custom property drives every layer's scale ───────
function applyFontSize() {
  document.documentElement.style.setProperty('--size-base', effectiveFontSize() + 'px');
}

// ── Keep the reading position across any re-render or reflow ────────
// The reference app solved this for fullscreen only (audit §3); here it
// wraps every content-changing control. Anchor = the topmost visible
// block; after the change, the first anchor candidate still present is
// scrolled back to its old viewport offset.
function anchorKept(change) {
  const blocks = Array.from(document.querySelectorAll('#reader [data-block-id]'));
  const anchors = [];
  for (const b of blocks) {
    const top = b.getBoundingClientRect().top;
    if (b.getBoundingClientRect().bottom > 0 && anchors.length === 0) {
      anchors.push({ id: b.dataset.blockId, top });
    } else if (anchors.length) {
      anchors.push({ id: b.dataset.blockId, top });
      if (anchors.length >= 12) break; // nearby fallbacks are enough
    }
  }
  change();
  for (const a of anchors) {
    const again = document.querySelector(`#reader [data-block-id="${a.id}"]`);
    if (again) {
      window.scrollBy(0, again.getBoundingClientRect().top - a.top);
      return;
    }
  }
}

// Put a block back where it stood: the same technique as anchorKept,
// across a whole navigation rather than a re-render. Scroll to a known
// base first, then move the block to the offset it had. The block id is
// the anchor, not a pixel count, so it survives a font-size change or a
// mode switch in between. Falls back to the top if the block is gone
// (Voice mode drops L4 entirely). This is also the piece a future exact
// resume across app death would reuse (BRIEF §9).
function restoreBlock(blockId, offset) {
  window.scrollTo(0, 0);
  const node = document.querySelector(
    `#reader [data-block-id="${CSS.escape(blockId)}"]`);
  if (!node) return;
  window.scrollBy(0, node.getBoundingClientRect().top - offset);
}

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
  } else if (view === 'texts' && cycle) {
    renderTexts(reader, cycle);
  } else if (view === 'home') {
    renderHome(reader);
  }
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

function applyLangs() {
  for (const [btn, key] of LANGS) {
    $(btn).classList.toggle('active', state[key]);
    $(btn).setAttribute('aria-pressed', String(state[key]));
  }
}

function toggleLang(key) {
  const on = LANGS.filter(([, k]) => state[k]).length;
  if (state[key] && on === 1) return; // the page never goes blank
  anchorKept(() => {
    set(key, !state[key]);
    applyLangs();
    rerender();
  });
}

// Phonetics belong to the liturgical layer (SCHEMA.md §5): the PHO
// toggle only appears on liturgies and prayers — on instructions and
// guides it would be a dead control, so it goes away entirely.
function applyPhonRelevance() {
  const kind = currentText ? currentText.kind : null;
  const relevant = kind === 'liturgy' || kind === 'prayer';
  $('btnPhon').style.display = relevant ? '' : 'none';
}

// ── Auto-scroll controls ────────────────────────────────────────────
function applyPlayIcon() {
  const running = scroll.isRunning();
  $('iconPlay').style.display = running ? 'none' : 'block';
  $('iconPause').style.display = running ? 'block' : 'none';
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
function changeFontSize(delta) {
  anchorKept(() => {
    set('fontSize', clampFont(state.fontSize + delta * FONT_STEP));
    applyFontSize();
  });
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

function jumpToSection(id) {
  const sec = document.querySelector(`#reader section[data-section-id="${CSS.escape(id)}"]`);
  if (!sec) return;
  const header = document.querySelector('.app-header');
  // Header is sticky in Guide mode, hidden in Voice mode (offsetParent null).
  const offset = header && header.offsetParent !== null
    ? header.getBoundingClientRect().height + 8 : 8;
  const y = window.scrollY + sec.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

function openContents() {
  buildContents();
  if ($('contentsGroup').hidden) return; // nothing to show
  $('contentsPanel').hidden = false;
  $('btnContents').setAttribute('aria-expanded', 'true');
  const first = $('contentsList').querySelector('.contents-link');
  if (first) first.focus();
}

function closeContents() {
  $('contentsPanel').hidden = true;
  $('btnContents').setAttribute('aria-expanded', 'false');
}

// ── Deity plates: the image, without losing the place (BRIEF §7) ────
// Dormant until the owner supplies the images: with an empty manifest
// the renderer emits no plate and none of this is reachable. When it is
// reachable, the reading position is untouchable — the viewer is an
// overlay (the page beneath never scrolls), the auto-scroll is held
// while it is up, and closing restores both it and the focus.
const DEITY_META = [
  ['day', 'deityDay'],
  ['family', 'deityFamily'],
  ['direction', 'deityDirection'],
  ['color', 'deityColor'],
  ['seed', 'deitySeed'],
];
// Name lines, in the app's usual order. Every value is manifest data.
const DEITY_NAMES = [['bo', 'bo'], ['phon', 'phon'], ['sa', 'sa'], ['en', 'en']];

let deityScrollHeld = false;
let deityOpener = null;

function deityMetaRow(parent, label, value) {
  const row = document.createElement('div');
  row.className = 'deity-meta-row';
  const l = document.createElement('span');
  l.className = 'deity-meta-label';
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'deity-meta-value';
  v.textContent = String(value);
  row.append(l, v);
  parent.appendChild(row);
}

function openDeity(id) {
  const deity = deityEntry(id);
  if (!deity || !deity.image) return;

  const img = $('deityViewerImage');
  img.src = deity.image;
  img.alt = deity.en || deity.sa || deity.bo || '';

  const name = $('deityViewerName');
  name.textContent = '';
  for (const [field, cls] of DEITY_NAMES) {
    if (!deity[field]) continue;
    const line = document.createElement('span');
    line.className = `deity-name-line ${cls}`;
    line.textContent = deity[field];
    name.appendChild(line);
  }

  const meta = $('deityViewerMeta');
  meta.textContent = '';
  for (const [field, key] of DEITY_META) {
    const value = deity[field];
    if (value === null || value === undefined || value === '') continue;
    deityMetaRow(meta, t(key), value);
  }
  const consort = deity.consort ? deityEntry(deity.consort) : null;
  if (consort) {
    deityMetaRow(meta, t('deityConsort'), consort.en || consort.bo || consort.id);
  }

  // Provenance travels with the picture, always (BRIEF §7).
  const credit = [deity.attribution, deity.license].filter(Boolean).join(' · ');
  $('deityViewerCredit').textContent = credit;
  $('deityViewerCredit').hidden = !credit;

  deityOpener = document.activeElement;
  deityScrollHeld = scroll.isRunning();
  if (deityScrollHeld) { scroll.stop(); applyPlayIcon(); }
  $('deityViewer').hidden = false;
  $('btnDeityClose').focus();
}

function closeDeity() {
  if ($('deityViewer').hidden) return;
  $('deityViewer').hidden = true;
  if (deityScrollHeld) { scroll.start(); applyPlayIcon(); }
  deityScrollHeld = false;
  if (deityOpener && document.contains(deityOpener)) deityOpener.focus();
  deityOpener = null;
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
  $('iconExpand').style.display = fs ? 'none' : 'block';
  $('iconCompress').style.display = fs ? 'block' : 'none';
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
}

// Leaving a text for one of the doorway pages: stop the scroll, drop
// the overlays, and let go of the text (nothing is highlighted in the
// catalogue while none is open).
function leaveText() {
  scroll.stop();
  closeContents();
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
    if (restore) restoreBlock(restore.blockId, restore.offset);
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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
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
    $('btnFs').style.display = 'none';
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
    const plate = e.target.closest('.deity-open');
    if (plate && plate.dataset.deityRef) {
      openDeity(plate.dataset.deityRef);
      return;
    }
    const btn = e.target.closest('.l0-marker');
    if (!btn) return;
    const wrap = btn.closest('.voice-collapsed');
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
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
    // Iconography holds a single affordance, not a text: tapping the
    // Zhitro Mandala replays the opening arising (js/intro.js).
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
    }
    nav.appendChild(cat);
  }
  // The app opens on the doorway, not on a text: two ways in, chosen by
  // the reader (owner's direction, 2026-07-30).
  showHome();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
