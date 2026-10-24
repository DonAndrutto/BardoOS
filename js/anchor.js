// Keeping the reader's line.
//
// Every control that changes what the text looks like — the type size,
// the layers shown, Voice mode, fullscreen — reflows the page under
// someone who is reading it aloud at a bedside. The line they were on
// must not move. Note that this is *not* the same as keeping `scrollY`:
// scrollY staying put while the text grows around it is exactly how a
// reader loses their place, and it is the failure this module exists to
// prevent (scripts/bench/bench.mjs measures the line, not the offset).
//
// Three things it does differently from the obvious approach:
//
//   1. It anchors to the *nearest visible* element — whatever is
//      actually at the reader's line, found with one hit test — rather
//      than to the topmost element with any pixel on screen. Those are
//      not the same element: the topmost one is usually scrolled most of
//      the way off, and holding *its* top still pushes everything below
//      it down by however much it grew. That is where the old anchor's
//      53px of drift came from on a single tap of the size control.
//
//   1b. And "nearest" means the smallest thing under the reader's line,
//      not the biggest: the run of Tibetan or English itself, then the
//      block around it, then the portion around that. The smallest is
//      the best anchor, and under a layer toggle it is the *only* good
//      one — hiding the Tibetan changes a block's height and leaves the
//      English run it contains untouched, so the English is exactly
//      where the reader still is.
//
//   1c. And it holds the reader's *place within* that element, not the
//      element's top edge. A long address runs eight hundred pixels; a
//      reader half way down one is not at its top, and pinning the top
//      moves them by however much the half above them grew — measured
//      at 200px on one tap, a fifth of a phone screen. So the anchor
//      records how far through the element the line falls and restores
//      that fraction. Under a size change this is exact: line n of m
//      sits at n/m of the height whatever the size, because both scale
//      together.
//
//   2. It reads geometry once, in the event handler, and corrects
//      there — one deliberate synchronous layout, not ninety.
//
//   3. It then *converges*: the first correction is not always the last
//      word, because a section the browser is skipping
//      (`content-visibility: auto`) settles to its true height only when
//      it is scrolled into view. So the anchor is watched over the next
//      few frames until it holds still, using an IntersectionObserver
//      for the live viewport position. That matters: an observer hands
//      over `boundingClientRect` computed during the browser's own
//      frame, so nothing here ever calls `getBoundingClientRect()` or
//      touches `scrollHeight` inside `requestAnimationFrame` — which
//      would force a synchronous layout in the middle of the frame that
//      is trying to paint, on every frame.

const NUDGE = 8;            // clear of the sticky header
const PROBES = [0, 40, 96]; // where to look for the reader's line
const SETTLED = 0.5;        // px: closer than this counts as arrived
const STABLE = 2;           // frames it must hold before we let go
const MAX_PASSES = 12;      // ~200ms; a runaway correction is worse than none

let guard = () => true;

// The caller says when converging would be fighting something else —
// the auto-scroll is deliberately moving the page, and correcting
// against it would cancel the recitation out from under the reader.
export function setGuard(fn) { guard = fn; }

let live = null; // the convergence in flight, if any

export function abort() {
  if (!live) return;
  live.io.disconnect();
  live = null;
}

// Where the reader is looking: just under the sticky header, or the top
// of the viewport where there is no header (Voice mode hides it).
export function line() { return readerLine(); }

function readerLine() {
  const header = document.querySelector('.app-header');
  const shown = header && header.offsetParent !== null;
  return (shown ? header.getBoundingClientRect().height : 0) + NUDGE;
}

// A rect a browser will not give geometry for: a descendant of a
// section whose contents are currently skipped reports all zeros.
// Such an element is not on screen, so it is never the anchor.
function laidOut(r) {
  return r.width > 0 || r.height > 0;
}

// One hit test at the reader's line, then a couple more a little lower
// in case that line fell in a margin, on a run label, or on the frame
// of a panel rather than on prose.
//
// `elementsFromPoint`, not `elementFromPoint`: the catalogue can be open
// over the text on a narrow screen, and the topmost thing at that point
// is then the sidebar. The plural form hands back the whole stack, so
// the block underneath is still found and a reader with the catalogue
// open does not silently lose the anchoring.
function hitStack(x, y) {
  if (typeof document.elementsFromPoint === 'function') {
    return document.elementsFromPoint(x, y);
  }
  const one = document.elementFromPoint(x, y);
  return one ? [one] : [];
}

const FIELD = '.bo, .phon, .en';

// The element, where the line fell in it, and how to find it again if a
// re-render has replaced it with an equal-but-different node.
function markOf(el, at, find) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!laidOut(r)) return null;
  return {
    el,
    find,
    line: at,
    frac: r.height > 0 ? Math.min(1, Math.max(0, (at - r.top) / r.height)) : 0,
  };
}

function anchorAt(line) {
  const reader = document.getElementById('reader');
  if (!reader) return null;
  const rr = reader.getBoundingClientRect();
  const x = Math.round(rr.left + rr.width / 2);
  for (const dy of PROBES) {
    const at = Math.round(line + dy);
    let hit = null;
    for (const node of hitStack(x, at)) {
      if (node.closest && node.closest('#reader')) { hit = node; break; }
    }
    if (!hit) continue;

    const block = hit.closest('#reader [data-block-id]');
    if (!block) continue;
    const id = block.dataset.blockId;
    const field = hit.closest(FIELD);
    const section = block.closest('#reader section[data-section-id]');
    const secId = section ? section.dataset.sectionId : null;
    const kind = field
      ? (field.classList.contains('bo') ? 'bo'
        : field.classList.contains('phon') ? 'phon' : 'en')
      : null;

    // Smallest first. Whichever of these is still on the page after the
    // change is the one the reader's line comes back to.
    const chain = [
      field && markOf(field, at,
        () => { const b = blockNode(id); return b ? b.querySelector('.' + kind) : null; }),
      markOf(block, at, () => blockNode(id)),
      section && markOf(section, at, () => sectionNode(secId)),
    ].filter(Boolean);
    if (chain.length) return chain;
  }
  return null;
}

// How far the element is from having the reader's line back where it
// was: its top, plus the same fraction of its (possibly new) height.
function offsetOf(rect, mark) {
  return rect.top + mark.frac * rect.height - mark.line;
}

function blockNode(id) {
  return document.querySelector(`#reader [data-block-id="${CSS.escape(id)}"]`);
}

function sectionNode(id) {
  return document.querySelector(`#reader section[data-section-id="${CSS.escape(id)}"]`);
}

// Watch one element until it sits at `want` and stays there. Positions
// arrive from the observer, so no frame here forces a layout; a fresh
// observation is asked for by re-observing, which the browser delivers
// on its next intersection pass — one per frame.
function converge(node, mark) {
  abort();
  if (!node || typeof IntersectionObserver !== 'function') return;
  const state = { passes: 0, stable: 0, io: null };
  const io = new IntersectionObserver((entries) => {
    if (live !== state) return;
    if (!guard() || !node.isConnected) { abort(); return; }
    const entry = entries[entries.length - 1];
    const delta = offsetOf(entry.boundingClientRect, mark);
    state.passes += 1;
    if (Math.abs(delta) < SETTLED) {
      state.stable += 1;
    } else {
      state.stable = 0;
      window.scrollBy(0, delta);
    }
    if (state.stable >= STABLE || state.passes >= MAX_PASSES) { abort(); return; }
    io.unobserve(node);
    io.observe(node); // ask for the next frame's position
  });
  state.io = io;
  live = state;
  io.observe(node);
}

// Run `change`, and put the reader's line back where it was.
export function keep(change) {
  abort();
  const chain = anchorAt(readerLine());

  change();

  if (!chain) return;

  // One synchronous read, here in the handler where a layout is honest,
  // and one correction. Then let the frames settle the rest.
  for (const mark of chain) {
    // The same node if nothing was rebuilt (a layer toggle rebuilds
    // nothing at all); its replacement if something was.
    const node = mark.el.isConnected ? mark.el : mark.find();
    if (!node) continue;
    const r = node.getBoundingClientRect();
    if (!laidOut(r)) continue; // hidden, or in a portion not laid out
    window.scrollBy(0, offsetOf(r, mark));
    converge(node, mark);
    return;
  }
}

// Move one element to a given viewport offset and hold it there. The
// same convergence the reflow controls use, offered to anything that
// needs to *land* somewhere rather than merely start moving: a jump
// across thirty thousand pixels of text passes portions the browser has
// only estimated the height of, and every one it lays out for real on
// the way moves the target. One scroll gets close; the frames after it
// arrive.
export function settle(node, top) {
  land(node, top, 0); // its top edge, not a place within it
}

// The same, for a place part way through the element: `frac` of its
// height is put at `top`. Leaving page mode lands this way, so the line
// the page began with is the line the scrolling reader is on.
export function land(node, top, frac) {
  abort();
  if (!node) return;
  const mark = { line: top, frac };
  window.scrollBy(0, offsetOf(node.getBoundingClientRect(), mark));
  converge(node, mark);
}

// Put one named block back at a given viewport offset, across a whole
// navigation rather than a re-render. The block id is the anchor, not a
// pixel count, so it survives a size change or a mode switch in between.
//
// The portion comes first deliberately: a block deep in a text the
// browser has not laid out yet has no geometry to aim at, so we move to
// its portion — which always does — and let the convergence land the
// block itself once it is real.
export function restore(blockId, offset) {
  abort();
  window.scrollTo(0, 0);
  const node = blockNode(blockId);
  if (!node) return;

  // The trail records a block's top edge, so that is what comes back.
  const mark = { line: offset, frac: 0 };
  const sec = node.closest('#reader section[data-section-id]');
  if (sec) window.scrollBy(0, sec.getBoundingClientRect().top - offset);

  const r = node.getBoundingClientRect();
  if (laidOut(r)) window.scrollBy(0, offsetOf(r, mark));
  converge(node, mark);
}
