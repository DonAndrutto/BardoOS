// Intro — the mandala at the door. The Samantabhadra yab-yum tagdrol
// arises, abides, and dissolves once while the app boots beneath the
// veil; then #intro fades and is removed. A tap or a key skips it, and
// prefers-reduced-motion never sees it at all — the reader at 3 a.m.
// is never made to wait.
//
// Ported scene-for-scene from the Claude Design handoff
// (mandala-piece.jsx). The artwork is cut into concentric annulus
// bands that counter-rotate while a pulsing halo sits over the still
// central figure. Band radii were measured on the artwork so no
// boundary cuts a syllable circle: the medallion ring and hexagram
// (40.5–67.5%) rotate as one rigid unit; everything inside 22.5%
// (figure, head halo, lotus seat, inner arcs) is static.

const IMG = 'assets/intro/mandala.webp';

// Wall-clock scene lengths, as retimed in the design tool, mapped onto
// the authored 6/10/4-second choreography (the prototype engine's
// time-stretch: progress is the shared clock; rotation and the halo
// pulse follow authored seconds).
const WALL = [1.9, 1.0, 1.9]; // Arising, Abiding, Dissolving
const DUR = [6, 10, 4];
const CUM = [0, 6, 16];
const TOTAL = WALL[0] + WALL[1] + WALL[2];

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

const SCENES = [arising, abiding, dissolving];

// ── The veil itself ─────────────────────────────────────────────────
const intro = document.getElementById('intro');
let raf = 0;
let done = false;

function end() {
  if (done || !intro) return;
  done = true;
  cancelAnimationFrame(raf);
  intro.removeEventListener('pointerdown', end);
  window.removeEventListener('keydown', end);
  intro.classList.add('intro-out');
  const drop = () => intro.remove();
  intro.addEventListener('transitionend', drop, { once: true });
  setTimeout(drop, 700); // transitionend can be swallowed in a hidden tab
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
  };
}

function frame(els, t) {
  let ix = 0;
  let start = 0;
  while (ix < WALL.length - 1 && t >= start + WALL[ix]) { start += WALL[ix]; ix += 1; }
  const p = clamp((t - start) / WALL[ix], 0, 1);
  const cum = CUM[ix] + p * DUR[ix];
  const st = SCENES[ix](p);
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
  if (!intro) return;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      end();
      return;
    }
    intro.addEventListener('pointerdown', end);
    window.addEventListener('keydown', end);

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

    const els = build();
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      if (t >= TOTAL) {
        frame(els, TOTAL); // settle on the dissolved (dark) end frame
        end();
        return;
      }
      frame(els, t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  } catch {
    end(); // the veil must never strand the reader outside the app
  }
}

start();
