// How tall a portion of a text is, before the browser has laid it out.
//
// `content-visibility: auto` on each portion of a text lets the browser
// skip layout and paint for everything off screen, which is most of a
// ninety-block pointing-out. The price is that it must be told roughly
// how tall the skipped portions are, or the scrollbar is a fiction and
// the page jumps as the reader travels down it.
//
// That number is measured here, with pretext, which answers "how tall is
// this text in a column this wide" without a DOM node, without a layout,
// and without a reflow — so measuring the *entire* longest text costs
// less than laying out one screen of it. The `auto` keyword means the
// browser prefers a portion's real height once it has seen it; this is
// what stands in until then, and what corrects it when the reader
// changes the type size, because a remembered height measured at 19px is
// simply wrong at 31px.
//
// It is an estimate and it is treated as one. Elements are grouped by
// the shape they share — the layer, the form, the field — and one of
// each shape is read for its style and its column width, rather than all
// one hundred and seventy-three. A block carrying a per-block font-size
// override is measured as its neighbours; that is a few pixels in a
// number whose whole job is to be approximately right before anyone has
// looked at it.
//
// Nothing here is load-bearing. Where pretext cannot run, no property is
// written and the CSS fallback stands.

import { styleOf, heightOf, isAvailable } from './measure.js';

const FIELDS = '.bo, .phon, .en';

// Which layers the reader currently has lit. A field that is not shown
// occupies nothing, so it is not measured.
function showing(reader) {
  return {
    bo: reader.classList.contains('show-bo'),
    phon: reader.classList.contains('show-phon'),
    en: reader.classList.contains('show-en'),
  };
}

function fieldKind(el) {
  if (el.classList.contains('bo')) return 'bo';
  if (el.classList.contains('phon')) return 'phon';
  return 'en';
}

// Everything that decides how this text is set: its own classes and
// those of the block and run around it.
function shapeKey(el) {
  const block = el.closest('.block');
  const run = el.closest('[class^="run-"]');
  return `${el.className}|${block ? block.className : ''}|${run ? run.className : ''}`;
}

// A shape's column width. Read from a laid-out example where there is
// one; where the only examples live in portions the browser is currently
// skipping, they have no geometry at all, so fall back to the reading
// surface capped by whatever measure the CSS puts on this shape.
function widthFor(el, readerWidth) {
  const r = el.getBoundingClientRect();
  if (r.width > 0) return r.width;
  const max = parseFloat(getComputedStyle(el).maxWidth);
  return Number.isFinite(max) ? Math.min(readerWidth, max) : readerWidth;
}

export function refresh(reader) {
  if (!reader || !isAvailable() || !reader.dataset.textId) return;
  const sections = reader.querySelectorAll(':scope > section[data-section-id]');
  if (!sections.length) return;

  const lit = showing(reader);
  const readerWidth = reader.getBoundingClientRect().width;
  if (!(readerWidth > 0)) return;

  // ── One read pass, then arithmetic ────────────────────────────────
  // Every getComputedStyle and every rect happens here, in a batch, with
  // no writes in between. What follows touches nothing.
  const shapes = new Map();
  const plan = [];
  for (const sec of sections) {
    const items = [];
    for (const field of sec.querySelectorAll(FIELDS)) {
      if (!lit[fieldKind(field)]) continue;
      const text = field.textContent;
      if (!text) continue;
      const key = shapeKey(field);
      if (!shapes.has(key)) shapes.set(key, { el: field });
      items.push({ text, key });
    }
    plan.push({
      node: sec,
      items,
      // The chrome around the words: one gap per block, plus the
      // portion's heading. Adding each run's own padding, border and
      // label on top of that was tried and made the whole estimate
      // *worse* — a run's vertical margins collapse with the block
      // margins already counted, so the frames were paid for twice. The
      // measured error across the longest text is 0.4% as this stands.
      blocks: sec.querySelectorAll('[data-block-id]').length,
    });
  }
  for (const shape of shapes.values()) {
    shape.width = widthFor(shape.el, readerWidth);
    shape.style = styleOf(shape.el);
  }
  const sample = sections[0].querySelector('.block');
  const gap = sample ? parseFloat(getComputedStyle(sample).marginBottom) || 0 : 0;
  const heading = sections[0].querySelector('.section-heading');
  const headingH = heading ? heading.getBoundingClientRect().height || 0 : 0;

  // ── One write pass ────────────────────────────────────────────────
  for (const { node, items, blocks } of plan) {
    let total = headingH + blocks * gap;
    let measured = true;
    for (const { text, key } of items) {
      const shape = shapes.get(key);
      const r = shape.style ? heightOf(text, shape.style, shape.width) : null;
      if (!r) { measured = false; break; }
      total += r.height;
    }
    // A portion we could not measure keeps the CSS fallback rather than
    // a number we made up.
    if (measured && total > 0) node.style.setProperty('--cis', `${Math.round(total)}px`);
    else node.style.removeProperty('--cis');
  }
}

// The estimate is never urgent: it is what stands in for portions nobody
// is looking at. So it waits for the browser to be idle, and a reader
// walking the size control up five steps pays for one pass, not five.
const idle = typeof requestIdleCallback === 'function'
  ? requestIdleCallback
  : (fn) => setTimeout(fn, 1);
const unidle = typeof cancelIdleCallback === 'function'
  ? cancelIdleCallback
  : clearTimeout;

let pending = 0;

export function schedule(reader) {
  if (pending) unidle(pending);
  pending = idle(() => {
    pending = 0;
    try { refresh(reader); } catch { /* an estimate is never worth an error */ }
  }, { timeout: 500 });
}
