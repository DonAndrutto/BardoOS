// The invitation to support the work.
//
// Owner's direction (2026-08-14): after about twenty minutes of use, a
// plain note — if the reader finds the material valuable, they might
// support the translator and the maker of the site — pointing at the
// PayPal link the header already carries. BRIEF §2 governs the manner of
// it, exactly as it governs the home-screen invitation:
//
//   * once, ever — whatever the reader does with it is written down and
//     the invitation never returns;
//   * never during a recitation — Voice mode is the mode you use when
//     someone is dying, and nobody is asked for anything there (the CSS
//     does that half), and never while the auto-scroll is carrying the
//     reader through a text;
//   * plainly — no urgency, no second ask, no countdown shown to
//     anyone, and a × that is a real 44px target, the same size as the
//     way to say yes.
//
// Twenty minutes of *use*, not of wall clock: the count runs only while
// the app is actually on screen, and it carries across visits, so the
// reader who comes back for five minutes a day arrives at the same place
// as the one who sits down for twenty.

import { state, set, save } from './store.js';
import { isRunning } from './scroll.js';
import { t } from './i18n.js';

const AFTER = 20 * 60; // seconds of use before the offer is made
const TICK = 15;       // how often the clock is read, in seconds

const $ = (id) => document.getElementById(id);

const bar = $('supportInvite');
const action = $('btnSupport');
const close = $('btnSupportClose');

let timer = null;
let last = 0;      // performance.now() at the previous tick — monotonic
let unsaved = 0;   // seconds counted but not yet written down

function stopClock() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}

// localStorage is touched once a minute rather than every tick, and
// whenever the reader leaves — a settings write is cheap, but not
// something to do sixty times an hour for no reason.
function flush() {
  if (!unsaved) return;
  unsaved = 0;
  save();
}

function hide() {
  bar.hidden = true;
  document.body.classList.remove('has-support');
}

function show() {
  if (!bar.hidden) return;
  $('supportTitle').textContent = t('supportTitle');
  $('supportNote').textContent = t('supportNote');
  action.textContent = t('supportAction');
  close.setAttribute('aria-label', t('supportDismiss'));
  bar.hidden = false;
  document.body.classList.add('has-support');
  // The offer is on the screen; there is nothing left to count.
  flush();
  stopClock();
}

// Answered either way — followed to PayPal, or waved off. Both are an
// answer, and the app does not ask twice.
function answered() {
  unsaved = 0;
  set('supportAsked', true);
  hide();
  stopClock();
}

// A quiet moment: the mandala has lifted, the reader is looking at the
// app rather than at another tab, nothing is being recited, and no other
// invitation is already on the screen. Voice mode is the CSS's half.
function quiet() {
  return document.visibilityState === 'visible'
    && !document.getElementById('intro')
    && !isRunning()
    && $('installInvite').hidden;
}

function tick() {
  const now = performance.now();
  const elapsed = Math.round((now - last) / 1000);
  last = now;

  // Time spent in another tab, or with the phone in a pocket, is not
  // time spent with the app.
  if (document.visibilityState !== 'visible' || document.getElementById('intro')) return;

  // A throttled or suspended tab hands back an arbitrarily large gap on
  // its first tick; credit only what the reader could plausibly have sat
  // through since the last one.
  state.supportSeconds += Math.max(0, Math.min(elapsed, TICK * 2));
  unsaved += TICK;
  if (unsaved >= 60) flush();

  if (state.supportSeconds >= AFTER && quiet()) show();
}

function start() {
  if (!bar || state.supportAsked) return;

  close.addEventListener('click', answered);
  action.addEventListener('click', answered);

  // The clock is read on a timer rather than continuously; nothing here
  // draws, animates or measures the page.
  last = performance.now();
  timer = setInterval(tick, TICK * 1000);

  // Coming back to the tab restarts the measurement from now, so the
  // time away is never credited.
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    flush();
  });
  window.addEventListener('pagehide', flush);
}

start();
