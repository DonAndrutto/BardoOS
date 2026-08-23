// Auto-scroll — ported faithfully from the KGK Ngondro reference
// (docs/ngondro-audit.md §1): a requestAnimationFrame loop with a
// time-delta engine and a sub-pixel accumulator. Departures from the
// reference are the audited fixes only: the duplicated timing guard is
// gone, and arrival at a repeated passage holds *without* any pulse —
// nothing in Bardo OS animates beyond the scroll itself (BRIEF §9).
//
// One later departure, and the reason for it. The loop used to ask the
// browser two questions on every single frame: where every repeated
// panel currently sat (`getBoundingClientRect()` on each), and how tall
// the document was (`scrollHeight`). Both are layout-dependent, so both
// forced a synchronous layout in the middle of the frame that was trying
// to paint — sixty times a second, for the whole length of a recitation,
// on the oldest phone in the room. Neither question is asked here any
// more:
//
//   * a panel's arrival is an IntersectionObserver crossing a one-pixel
//     line at the trigger height. The browser already knows where
//     everything is during its own frame; this asks it to say so rather
//     than making it recompute on demand.
//   * the document's height is cached and refreshed by a ResizeObserver
//     when it actually changes.
//
// What is left in the loop is arithmetic and one `scrollBy`. `scrollY`
// and `innerHeight` stay: neither depends on layout.

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
// A panel "arrives" when its top edge crosses the line four tenths down
// the screen. That is a geometric event, and the browser will report it:
// the root is shrunk by rootMargin to a single pixel row at exactly that
// height, so a panel begins intersecting it precisely as its top edge
// passes. The window below the line is kept as the reference had it, so
// a panel that is already past the line when the reader arrives — a jump
// to a portion, a restored position — does not hold on a passage the
// reader has not reached.
let holdUntil = 0;
let resumeStart = 0;
const visited = new Set();
let arrivals = null;   // IntersectionObserver over the refrain panels
let watched = null;    // the panels it is watching, so we re-arm cheaply
let armedAt = 0;       // the viewport height the observer was built for
let pendingArrival = false;

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function onArrival(entries) {
  const vh = window.innerHeight;
  const line = vh * REFRAIN_TRIGGER_RATIO;
  for (const entry of entries) {
    const id = entry.target.dataset.refrainId;
    const top = entry.boundingClientRect.top;
    if (!entry.isIntersecting) {
      if (top > line) visited.delete(id); // back below the line: re-arm
      continue;
    }
    if (visited.has(id)) continue;
    if (top <= line && top > line - REFRAIN_TRIGGER_WINDOW) {
      visited.add(id);
      pendingArrival = true;
    }
  }
}

// The trigger line is a pixel height, so the observer belongs to one
// viewport size and is rebuilt when that changes.
function watchRefrains() {
  if (typeof IntersectionObserver !== 'function') return;
  const vh = window.innerHeight;
  const line = Math.round(vh * REFRAIN_TRIGGER_RATIO);
  const groups = document.getElementsByClassName('refrain-group');
  const same = watched && watched.length === groups.length && armedAt === vh
    && Array.prototype.every.call(groups, (g, i) => watched[i] === g);
  if (same) return;
  if (arrivals) arrivals.disconnect();
  armedAt = vh;
  watched = Array.prototype.slice.call(groups);
  if (!watched.length) { arrivals = null; return; }
  arrivals = new IntersectionObserver(onArrival, {
    rootMargin: `${-line}px 0px ${-(vh - line - 1)}px 0px`,
  });
  for (const g of watched) arrivals.observe(g);
}

// 0 while holding, eased ramp on resume, 1 at full speed.
function refrainMultiplier(ts) {
  if (pendingArrival && ts >= holdUntil) {
    pendingArrival = false;
    holdUntil = ts + REFRAIN_HOLD_MS;
    resumeStart = holdUntil;
    carry = 0;
  }
  if (ts < holdUntil) return 0;
  if (resumeStart) {
    const t = (ts - resumeStart) / REFRAIN_RESUME_MS;
    if (t >= 1) { resumeStart = 0; return 1; }
    return easeOutCubic(t);
  }
  return 1;
}

// ── How tall the document is, without asking every frame ────────────
// `scrollHeight` is layout-dependent; reading it inside the loop forced
// a layout on every frame. It changes rarely — a re-render, a size
// change, a portion the browser has just laid out for real — and a
// ResizeObserver says when.
let docHeight = 0;

function readDocHeight() {
  docHeight = document.documentElement.scrollHeight;
}

if (typeof ResizeObserver === 'function') {
  const ro = new ResizeObserver(() => { readDocHeight(); });
  ro.observe(document.documentElement);
} else {
  window.addEventListener('resize', readDocHeight, { passive: true });
}
window.addEventListener('resize', () => { readDocHeight(); watchRefrains(); },
  { passive: true });

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

  // scrollY and innerHeight are free; the document height is cached.
  if (docHeight && (window.innerHeight + window.scrollY) >= docHeight - 2) {
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
  pendingArrival = false;
  visited.clear();
  // Both of these are layout reads, done once, here — not per frame.
  readDocHeight();
  watchRefrains();
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

// The page under the engine changed shape — a text opened, Voice mode
// rebuilt it, the type size moved. Both cached answers are re-read here,
// once, outside the loop.
export function resync() {
  readDocHeight();
  watchRefrains();
}

export function toggle() { running ? stop() : start(); }
export function isRunning() { return running; }

export function setSpeed(s) { speed = Math.max(1, Math.min(10, s)); }
export function getSpeed() { return speed; }

// The UI reflects play state; reaching the bottom stops the engine
// itself, so it reports back.
export function onStopped(fn) { onStop = fn; }
