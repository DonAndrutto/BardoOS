// The invitation to support the work.
//
// The app is free and stays free; the translations behind it are years
// of one person's life. The owner asked (2026-08-14) for a single quiet
// ask: after about half an hour of real use, a screen saying so, and the
// PayPal link that is already in the header.
//
// BRIEF §2 governs the manner of it, exactly as it governs the
// home-screen invitation next door:
//
//   * once, ever — shown is asked, and it never returns, whatever the
//     reader does with it;
//   * never at a deathbed — not in Voice mode, not while the auto-scroll
//     is running, not on top of another overlay, and not while the
//     mandala is still at the door;
//   * dismissible four ways, none of them hidden: the ✕, a tap anywhere
//     outside the sheet, Escape, and Not now — the way to say no is
//     larger than the way to say yes;
//   * never with no signal, since a payment link that cannot load is
//     not an ask but a broken door. It waits for a better moment.
//
// "Half an hour of use" is half an hour with the app actually on screen,
// accumulated across visits, kept in the same settings store as
// everything else. Time with the app in a background tab is not use.

import { state, set, save } from './store.js';
import { t } from './i18n.js';
import { isRunning } from './scroll.js';

const AFTER_MS = 30 * 60 * 1000; // half an hour of use, cumulative
const TICK_MS = 10 * 1000;       // how often the clock is read
const FLUSH_TICKS = 6;           // …and written: once a minute, not every tick

const $ = (id) => document.getElementById(id);

const veil = $('supportVeil');

let timer = null;
let ticks = 0;
let opener = null; // whatever had focus, to give it back on dismissal

// The app is on screen and the intro veil has lifted. A backgrounded tab
// is not somebody reading.
function counting() {
  return document.visibilityState === 'visible' && !$('intro');
}

// Actually on screen — which is not the same as un-`hidden`. The
// home-screen invitation in particular stays revealed until it is
// answered, and merely goes `display: none` over an open text; asking
// after its `hidden` attribute would hold this invitation back for good.
function onScreen(node) {
  return Boolean(node && node.getClientRects().length);
}

// A moment that belongs to the reader, not to the ask. Any overlay of
// its own, any recitation in progress, anything the reader is in the
// middle of — the invitation simply waits for the next tick.
function welcome() {
  return counting()
    && navigator.onLine !== false
    && !document.body.classList.contains('voice')
    && !isRunning()
    && !onScreen($('deityViewer'))
    && !onScreen($('contentsPanel'))
    && !onScreen($('uiLangMenu'))
    && !onScreen($('installInvite'))
    && !document.body.classList.contains('nav-open');
}

function show() {
  const donate = document.querySelector('.donate-link');
  if (!donate) return; // no link to offer, so nothing to ask
  // Shown is asked: whatever the reader does from here, this is the once.
  set('supportAsked', true);

  $('supportTitle').textContent = t('supportTitle');
  $('supportBody').textContent = t('supportBody');
  const action = $('supportAction');
  action.textContent = t('supportAction');
  // The header's own link — one URL in the repo, and this is not it.
  action.href = donate.href;
  $('btnSupportDismiss').textContent = t('supportDismiss');
  $('btnSupportClose').setAttribute('aria-label', t('supportDismiss'));

  opener = document.activeElement;
  veil.hidden = false;
  $('btnSupportClose').focus();
}

function hide() {
  if (veil.hidden) return;
  veil.hidden = true;
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}

function stopCounting() {
  if (timer) { clearInterval(timer); timer = null; }
  save();
}

function tick() {
  if (!counting()) return;
  state.usedMs += TICK_MS;
  if (++ticks % FLUSH_TICKS === 0) save();
  if (state.usedMs < AFTER_MS || !welcome()) return;
  stopCounting();
  show();
}

function start() {
  if (!veil || state.supportAsked) return;

  $('btnSupportClose').addEventListener('click', hide);
  $('btnSupportDismiss').addEventListener('click', hide);
  // Tapping through to PayPal is an answer too, so the screen goes with
  // the tap rather than waiting behind the new tab.
  $('supportAction').addEventListener('click', hide);
  veil.addEventListener('click', (e) => {
    if (!e.target.closest('.support-sheet')) hide();
  });
  // It only ever opens when every other overlay is closed, so Escape
  // here can never be the one meant for something underneath.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  // The clock is worth keeping when the app is put down mid-session.
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
  });

  timer = setInterval(tick, TICK_MS);
}

start();
