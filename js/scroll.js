// Auto-scroll — ported faithfully from the KGK Ngondro reference
// (docs/ngondro-audit.md §1): a requestAnimationFrame loop with a
// time-delta engine and a sub-pixel accumulator. Departures from the
// reference are the audited fixes only: the duplicated timing guard is
// gone, and arrival at a repeated passage holds *without* any pulse —
// nothing in Bardo OS animates beyond the scroll itself (BRIEF §9).

const REFRAIN_HOLD_MS = 2600;   // rest on a repeated formula
const REFRAIN_RESUME_MS = 900;  // ease back up to speed afterwards
const REFRAIN_TRIGGER_RATIO = 0.40;  // viewport line where a panel "arrives"
const REFRAIN_TRIGGER_WINDOW = 220;  // px band below the line that can trigger
const USER_RESUME_MS = 500;     // quiet time after a touch before resuming
const MAX_FRAME_MS = 100;       // dt clamp: no lurch after a backgrounded tab

let running = false;
let raf = null;
let lastTime = 0;
let carry = 0;

let speed = 2; // 1..10
let onStop = null;

// pixels per second at speed 1..10 → ~38..200 px/s (reference values)
function pxPerSec() { return 20 + speed * 18; }

// ── Manual-touch override: pause instantly, resume after quiet ──────
let userPaused = false;
let resumeTimer = null;

function pauseForUser() {
  userPaused = true;
  if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
  lastTime = 0;
  carry = 0;
}
function scheduleResume() {
  if (resumeTimer) clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    userPaused = false;
    resumeTimer = null;
    lastTime = 0;
  }, USER_RESUME_MS);
}
window.addEventListener('touchmove', pauseForUser, { passive: true });
window.addEventListener('touchend', scheduleResume, { passive: true });
window.addEventListener('touchcancel', scheduleResume, { passive: true });
window.addEventListener('wheel', () => { pauseForUser(); scheduleResume(); }, { passive: true });

// ── Gentle hold on repeated passages (blocks with refrain: true) ────
let holdUntil = 0;
let resumeStart = 0;
const visited = new Set();

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function scanRefrainArrival(ts) {
  const groups = document.getElementsByClassName('refrain-group');
  const vh = window.innerHeight;
  const triggerY = vh * REFRAIN_TRIGGER_RATIO;
  for (const g of groups) {
    const top = g.getBoundingClientRect().top;
    if (top > vh) { visited.delete(g.dataset.refrainId); continue; } // re-arm below view
    if (visited.has(g.dataset.refrainId)) continue;
    if (top <= triggerY && top > triggerY - REFRAIN_TRIGGER_WINDOW) {
      visited.add(g.dataset.refrainId);
      holdUntil = ts + REFRAIN_HOLD_MS;
      resumeStart = holdUntil;
      carry = 0;
      break;
    }
  }
}

// 0 while holding, eased ramp on resume, 1 at full speed.
function refrainMultiplier(ts) {
  if (ts >= holdUntil) scanRefrainArrival(ts);
  if (ts < holdUntil) return 0;
  if (resumeStart) {
    const t = (ts - resumeStart) / REFRAIN_RESUME_MS;
    if (t >= 1) { resumeStart = 0; return 1; }
    return easeOutCubic(t);
  }
  return 1;
}

// ── The loop ────────────────────────────────────────────────────────
function loop(ts) {
  if (!running) return;

  if (userPaused) {
    lastTime = 0;
    carry = 0;
    raf = requestAnimationFrame(loop);
    return;
  }

  if (!lastTime) {
    lastTime = ts;
    raf = requestAnimationFrame(loop);
    return;
  }

  let dt = ts - lastTime;
  lastTime = ts;
  if (dt > MAX_FRAME_MS) dt = MAX_FRAME_MS;

  // Accumulate fractional movement; scroll by whole pixels only —
  // browsers round fractional scrollBy to zero, which would stall
  // every slow speed entirely.
  carry += pxPerSec() * refrainMultiplier(ts) * (dt / 1000);
  if (carry >= 1) {
    const px = Math.floor(carry);
    carry -= px;
    window.scrollBy({ top: px, behavior: 'auto' });
  }

  if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2) {
    stop();
    return;
  }

  raf = requestAnimationFrame(loop);
}

// ── Public surface ──────────────────────────────────────────────────
export function start() {
  if (running) return;
  running = true;
  lastTime = 0;
  carry = 0;
  holdUntil = 0;
  resumeStart = 0;
  visited.clear();
  raf = requestAnimationFrame(loop);
}

export function stop() {
  if (!running) return;
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  lastTime = 0;
  carry = 0;
  if (onStop) onStop();
}

export function toggle() { running ? stop() : start(); }
export function isRunning() { return running; }

export function setSpeed(s) { speed = Math.max(1, Math.min(10, s)); }
export function getSpeed() { return speed; }

// The UI reflects play state; reaching the bottom stops the engine
// itself, so it reports back.
export function onStopped(fn) { onStop = fn; }
