// Boot and controls. Guide mode shows everything in document order;
// Voice mode is the one you use when someone is dying: spoken layers
// only, large type, rubric collapsed to markers, one tap away (BRIEF §5).

import { loadCycle, loadText } from './data.js';
import { UI_LANGS, UI_LANG_BY_CODE, uiLangReady, t } from './i18n.js';
import { renderText } from './render.js';
import * as scroll from './scroll.js';
import { state, set, clampFont, effectiveFontSize, FONT_STEP } from './store.js';

const TODO = 'TODO_CONTENT';
const $ = (id) => document.getElementById(id);

let currentText = null; // the loaded text JSON currently on screen

// ── Theme: a manual choice wins; otherwise follow the system ────────
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const dark = state.theme ? state.theme === 'dark' : systemDark.matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  $('iconSun').style.display = dark ? 'none' : 'block';
  $('iconMoon').style.display = dark ? 'block' : 'none';
}
systemDark.addEventListener('change', () => { if (!state.theme) applyTheme(); });

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

function rerender() {
  if (currentText) renderText(currentText, $('reader'));
}

// ── Mode ────────────────────────────────────────────────────────────
function applyMode() {
  document.body.classList.toggle('voice', state.mode === 'voice');
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

function setMenu(open) {
  document.body.classList.toggle('nav-open', open);
  $('btnMenu').setAttribute('aria-expanded', String(open));
}

function navIsOpen() {
  return document.body.classList.contains('nav-open');
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

async function openText(id) {
  scroll.stop();
  // The docked sidebar stays; the overlay gets out of the way.
  if (!desktopNav.matches) setMenu(false);
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
    window.scrollTo(0, 0);
  } catch (err) {
    currentText = null;
    note(reader, `${t('couldNotLoadText')} (${err.message}).`);
  }
}

async function boot() {
  applyTheme();
  applyMode();
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

  // Sidebar: the corner button toggles it. As an overlay (narrow
  // screens) any way out closes it; docked, it stays until toggled.
  $('btnMenu').addEventListener('click', () => setMenu(!navIsOpen()));
  document.addEventListener('click', (e) => {
    if (navIsOpen() && !desktopNav.matches &&
        !$('nav').contains(e.target) && !$('btnMenu').contains(e.target)) {
      setMenu(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('uiLangMenu').hidden) {
      closeUiLangMenu();
      $('btnUiLang').focus();
      return;
    }
    if (navIsOpen() && !desktopNav.matches) {
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

  // Rubric peeking in Voice mode, and prayer cross-links — both
  // delegated: the reader's contents re-render often.
  $('reader').addEventListener('click', (e) => {
    const link = e.target.closest('.prayer-link');
    if (link && link.dataset.prayerRef) {
      openText(link.dataset.prayerRef);
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
  let cycle;
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
    nav.appendChild(cat);
  }
  const first = nav.querySelector('button.nav-text');
  if (first) first.click();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
