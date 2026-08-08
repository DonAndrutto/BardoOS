// The invitation to keep Bardo OS on the phone.
//
// The Phase 0 architecture proposal folded in a decision not to ask at
// all (docs/architecture.md §5). The owner reversed it on 2026-08-08:
// the app should offer itself to the home screen, because the reader who
// needs it at 3 a.m. should not have to find a browser tab first. The
// no-dark-patterns rule (BRIEF §2) still governs *how* it asks:
//
//   * once, ever — whatever the reader answers is written down and the
//     invitation never returns;
//   * on the doorway only, never over an open text and never in Voice
//     mode (the CSS does that half), and never once the app is already
//     installed;
//   * plainly — what it is, what it buys, and a way to say no that is
//     the same size as the way to say yes.
//
// Android and desktop Chromium fire `beforeinstallprompt`, which is held
// back and replayed when the reader taps. iOS fires nothing and has no
// API: there the invitation carries the two steps instead, since Add to
// Home Screen is buried in the share sheet and nobody finds it by luck.

import { state, set } from './store.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);

const bar = $('installInvite');
const action = $('btnInstall');
const close = $('btnInstallClose');

let deferred = null; // the browser's own prompt, held until the reader asks

// Already on the home screen: the display mode is the honest signal on
// Android and desktop, `standalone` is Safari's, and Android's WebAPK
// hands the referrer over when the launcher opens it.
function installed() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true
    || document.referrer.startsWith('android-app://');
}

// iPadOS reports itself as a Mac; the touch points give it away.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function answered() {
  set('installAsked', true);
  hide();
}

function hide() {
  bar.hidden = true;
  document.body.classList.remove('has-install');
}

function show() {
  if (state.installAsked || installed() || !bar) return;
  $('installTitle').textContent = t('installTitle');
  $('installNote').textContent = isIOS && !deferred ? t('installStepsIOS') : t('installNote');
  action.textContent = t('installAction');
  action.hidden = !deferred;
  close.setAttribute('aria-label', t('installDismiss'));
  bar.hidden = false;
  document.body.classList.add('has-install');
}

// Not while the mandala is still at the door, and not the instant it
// lifts: the reader arrives before anything asks them for something.
function whenSettled(fn) {
  const tick = () => {
    if (document.getElementById('intro')) { setTimeout(tick, 400); return; }
    setTimeout(fn, 1800);
  };
  tick();
}

function start() {
  if (!bar || state.installAsked || installed()) return;

  close.addEventListener('click', answered);

  action.addEventListener('click', async () => {
    const prompt = deferred;
    deferred = null;
    // The browser owns the question from here, and whichever way the
    // reader answers *it*, they have answered ours.
    answered();
    if (!prompt) return;
    try {
      prompt.prompt();
      await prompt.userChoice;
    } catch { /* the event goes stale if the tab was backgrounded */ }
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // hold it: the reader is asked in the app's own words
    deferred = e;
    whenSettled(show);
  });

  // Installed from the browser's own menu, or from another tab.
  window.addEventListener('appinstalled', answered);

  // iOS has no event to wait for, so the offer is made on its own.
  if (isIOS) whenSettled(show);
}

start();
