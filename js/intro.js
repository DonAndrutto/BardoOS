// Intro — the mandala at the door. The Samantabhadra yab-yum tagdrol
// arises and then abides, turning gently, until the reader taps or
// presses a key; only then does it dissolve and let the app through.
// Two seconds into the abiding, OPEN TO EXPLORE appears beneath the
// mandala so no one is left wondering what the door wants. A tap during
// the arising skips straight through, and prefers-reduced-motion never
// sees the veil at all — the reader at 3 a.m. is never made to wait.
//
// Ported scene-for-scene from the Claude Design handoff
// (mandala-piece.jsx). The artwork is cut into concentric annulus
// bands that counter-rotate while a pulsing halo sits over the still
// central figure. Band radii were measured on the artwork so no
// boundary cuts a syllable circle: the medallion ring and hexagram
// (40.5–67.5%) rotate as one rigid unit; everything inside 22.5%
// (figure, head halo, lotus seat, inner arcs) is static.

const IMG = 'assets/intro/mandala.webp';

// Wall-clock scene lengths mapped onto the authored 6/10/4-second
// choreography (the prototype engine's time-stretch: rotation and the
// halo pulse follow authored seconds). The abiding no longer has a
// fixed length — it holds until the reader acts, advancing authored
// time at HOLD_RATE so the rings keep turning and the halo breathing.
const ARISE_W = 1.9; // wall seconds, mapped onto authored 0–6
const DISSOLVE_W = 1.9; // wall seconds, mapped onto authored 16–20
const ARISE_D = 6;
const DISSOLVE_D = 4;
const HOLD_RATE = 3.2; // authored seconds per wall second while abiding
const CTA_DELAY = 2; // seconds after the arising before OPEN TO EXPLORE

// Shipped tweak values from the handoff (TWEAK_DEFAULTS).
const SPIN = 0.6;
const HALO = 0.6;

// Annulus bands, % of disc radius, + spin speed (deg / authored second).
const RINGS = [
  { i: 22.5, o: 31.0, v: -1.3 },
  { i: 31.0, o: 40.5, v: 1.0 },
  { i: 40.5, o: 67.5, v: -0.7 },
  { i: 67.5, o: 75.5, v: 0.55 },
  { i: 75.5, o: 87.0, v: -0.45 },
  { i: 87.0, o: 100, v: 0.35 },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const eo = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3); // easeOutCubic
const sm = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); }; // smoothstep
const w = (p, s, d) => clamp((p - s) / d, 0, 1);

const mask = (inner, outer) =>
  `radial-gradient(circle closest-side at 50% 50%, rgba(0,0,0,0) ${Math.max(inner - 0.7, 0)}%, #000 ${inner}%, #000 ${outer}%, rgba(0,0,0,0) ${Math.min(outer + 0.7, 100.5)}%)`;

// ── Scene choreography: frame state at progress p ∈ [0,1] ───────────
function arising(p) {
  return {
    glowA: eo(w(p, 0, 0.25)),
    center: { a: eo(w(p, 0.04, 0.28)), s: 0.92 + 0.08 * eo(w(p, 0.04, 0.35)) },
    rings: RINGS.map((r, j) => {
      const q = w(p, 0.2 + j * 0.1, 0.22);
      return { a: sm(q), extra: (1 - eo(q)) * (r.v > 0 ? -38 : 38), scale: 1.06 - 0.06 * eo(q) };
    }),
    haloBoost: 1,
    labelA: 0,
  };
}

function abiding() {
  return {
    glowA: 1,
    center: { a: 1, s: 1 },
    rings: RINGS.map(() => ({ a: 1, extra: 0, scale: 1 })),
    haloBoost: 1,
    labelA: 0,
  };
}

function dissolving(p) {
  return {
    glowA: 1 - sm(w(p, 0.7, 0.3)),
    center: { a: 1 - sm(w(p, 0.55, 0.35)), s: 1 - 0.03 * sm(w(p, 0.55, 0.4)) },
    rings: RINGS.map((r, j) => {
      const q = w(p, (5 - j) * 0.08, 0.32);
      return { a: 1 - sm(q), extra: sm(q) * (r.v > 0 ? 22 : -22), scale: 1 - 0.04 * sm(q) };
    }),
    haloBoost: 1 + 0.6 * sm(w(p, 0.1, 0.4)) * (1 - sm(w(p, 0.5, 0.4))),
    // the sign emerges as the mandala dissolves, then fades to dark
    labelA: sm(w(p, 0.35, 0.3)) * (1 - sm(w(p, 0.82, 0.16))),
  };
}

// ── The veil itself ─────────────────────────────────────────────────
// The markup sits in index.html for the first arising; kept here too so
// the veil can be summoned again (the Iconography entry replays it, and
// the mandala arises exactly as it does on opening the app).
const INTRO_HTML =
  '<div class="intro-glow"></div>' +
  '<div class="intro-disc"></div>' +
  '<div class="intro-label">BARDO OS</div>' +
  '<div class="intro-cta">OPEN TO EXPLORE</div>' +
  '<div class="intro-grain"></div>';

let intro = document.getElementById('intro');
let raf = 0;
let done = false;
let dissolveFrom = null; // { at: wall seconds, cum: authored seconds } once tapped

function end() {
  if (done || !intro) return;
  done = true;
  cancelAnimationFrame(raf);
  intro.removeEventListener('pointerdown', proceed);
  window.removeEventListener('keydown', proceed);
  intro.classList.add('intro-out');
  const drop = () => intro.remove();
  intro.addEventListener('transitionend', drop, { once: true });
  setTimeout(drop, 700); // transitionend can be swallowed in a hidden tab
}

// The reader's tap. During the arising it skips straight through;
// while the mandala abides it begins the dissolving scene.
let proceedFn = end;
function proceed(e) {
  proceedFn(e);
}

function build() {
  const disc = intro.querySelector('.intro-disc');
  const layer = (m) => {
    const el = document.createElement('div');
    el.className = 'intro-layer';
    el.style.webkitMaskImage = m;
    el.style.maskImage = m;
    disc.appendChild(el);
    return el;
  };
  const rings = RINGS.map((r) => layer(mask(r.i, r.o)));
  const center = layer(mask(0, 22.9)); // static central figure, above the bands
  const halo = document.createElement('div');
  halo.className = 'intro-halo';
  disc.appendChild(halo);
  return {
    rings,
    center,
    halo,
    glow: intro.querySelector('.intro-glow'),
    label: intro.querySelector('.intro-label'),
    cta: intro.querySelector('.intro-cta'),
  };
}

// Paint one frame: a scene state at an authored-seconds clock.
function paint(els, st, cum) {
  const pulse = 0.72 + 0.28 * Math.sin((cum * Math.PI * 2) / 6 - Math.PI / 2);
  els.glow.style.opacity = st.glowA;
  for (let j = 0; j < RINGS.length; j += 1) {
    const r = st.rings[j];
    const el = els.rings[j];
    el.style.opacity = r.a;
    el.style.transform = `rotate(${RINGS[j].v * SPIN * cum + r.extra}deg) scale(${r.scale})`;
  }
  els.center.style.opacity = st.center.a;
  els.center.style.transform = `scale(${st.center.s})`;
  els.halo.style.opacity = clamp(HALO * pulse * st.haloBoost, 0, 1) * st.center.a;
  els.halo.style.transform = `translate(-50%,-50%) scale(${1 + 0.05 * pulse})`;
  els.label.style.opacity = st.labelA;
}

async function start() {
  intro = document.getElementById('intro');
  if (!intro) return;
  // A fresh arising (first boot, or a replay): clear any prior run's state.
  cancelAnimationFrame(raf);
  done = false;
  dissolveFrom = null;
  proceedFn = end;
  intro.classList.remove('intro-out');
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      end();
      return;
    }
    intro.addEventListener('pointerdown', proceed);
    window.addEventListener('keydown', proceed);

    // The dark plate is the loading state; if the artwork isn't ready
    // soon (first visit on a slow line), the door just opens.
    const img = new Image();
    img.src = IMG;
    const slow = setTimeout(end, 3000);
    try {
      await img.decode();
    } finally {
      clearTimeout(slow);
    }
    if (done) return;

    // JS now owns the veil's lifetime — the CSS failsafe (there for the
    // case where this module never runs) must not lift it from under us
    // while the mandala waits for the reader.
    intro.style.animation = 'none';

    const els = build();
    const t0 = performance.now();
    let cum = 0; // authored-seconds clock, continuous across scenes

    proceedFn = () => {
      if (done || dissolveFrom) return;
      const t = (performance.now() - t0) / 1000;
      if (t < ARISE_W) { end(); return; } // tapped mid-arising: just skip
      els.cta.classList.remove('show');
      dissolveFrom = { at: t, cum };
    };

    const tick = (now) => {
      const t = (now - t0) / 1000;
      if (dissolveFrom) {
        const p = clamp((t - dissolveFrom.at) / DISSOLVE_W, 0, 1);
        cum = dissolveFrom.cum + p * DISSOLVE_D;
        paint(els, dissolving(p), cum);
        if (p >= 1) { end(); return; } // settled on the dissolved (dark) end frame
      } else if (t < ARISE_W) {
        const p = t / ARISE_W;
        cum = p * ARISE_D;
        paint(els, arising(p), cum);
      } else {
        // Abiding: the mandala holds — turning, breathing — until the
        // reader taps. Two seconds in, the invitation appears.
        cum = ARISE_D + (t - ARISE_W) * HOLD_RATE;
        paint(els, abiding(), cum);
        if (t >= ARISE_W + CTA_DELAY) els.cta.classList.add('show');
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  } catch {
    end(); // the veil must never strand the reader outside the app
  }
}

// Summon the veil again after the app is running — the Iconography
// entry (Zhitro Mandala) uses this to replay the opening arising. If the
// original veil already dissolved away, its markup is rebuilt first.
export function replayIntro() {
  if (!document.getElementById('intro')) {
    const veil = document.createElement('div');
    veil.id = 'intro';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = INTRO_HTML;
    document.body.appendChild(veil);
  }
  start();
}

start();
