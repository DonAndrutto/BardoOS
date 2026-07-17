// Boot and controls. Guide mode shows everything in document order;
// Voice mode is the one you use when someone is dying: spoken layers
// only, large type, rubric collapsed to markers, one tap away (BRIEF §5).

import { loadCycle, loadText } from './data.js';
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
  $('speedVal').textContent = String(state.scrollSpeed);
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

// ── Navigation (bare until Phase 3) ─────────────────────────────────
function note(container, message) {
  container.textContent = '';
  const p = document.createElement('p');
  p.className = 'block layer-L0';
  p.textContent = message;
  container.appendChild(p);
}

async function openText(id, button) {
  scroll.stop();
  const reader = $('reader');
  document.querySelectorAll('.nav button').forEach((b) =>
    b.classList.toggle('active', b === button));
  try {
    currentText = await loadText(id);
    renderText(currentText, reader);
    window.scrollTo(0, 0);
  } catch (err) {
    currentText = null;
    note(reader, `Could not load this text (${err.message}).`);
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

  // Rubric peeking in Voice mode (delegated: markers are re-rendered often)
  $('reader').addEventListener('click', (e) => {
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
    note(reader, `Could not load the cycle manifest (${err.message}).`);
    return;
  }
  if (!cycle.groups.length) {
    note(reader, 'No texts in the cycle yet.');
    return;
  }
  for (const group of cycle.groups) {
    const h = document.createElement('h2');
    h.textContent = group.heading.en;
    nav.appendChild(h);
    for (const id of group.texts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = id; // replaced by the title once known; the id is the honest fallback
      b.title = id;
      b.addEventListener('click', () => openText(id, b));
      nav.appendChild(b);
      loadText(id).then((t) => {
        if (t.title.en && t.title.en !== TODO) b.textContent = t.title.en;
      }).catch(() => {});
    }
  }
  const first = nav.querySelector('button');
  if (first) first.click();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
