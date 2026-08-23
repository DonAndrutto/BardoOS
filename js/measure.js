// Text measurement — the one door onto @chenglou/pretext.
//
// Every measurement in this app that would otherwise force the browser
// to lay the page out comes through here. Pretext measures text with the
// browser's own font engine (canvas) and then does the line-breaking in
// arithmetic, so asking "how tall is this paragraph at this width?"
// costs no layout, no reflow, and nothing in the DOM at all.
// js/vendor/pretext/README.md records where the library came from.
//
// Three disciplines this module holds to, because getting any of them
// wrong makes the numbers quietly wrong rather than loudly broken:
//
//   1. The font string comes from getComputedStyle on the element that
//      actually holds the text — not from a constant, and not from a
//      parent. `fontFamily` there is the *whole* fallback chain
//      ('EB Garamond', Georgia, serif), which is what canvas needs: give
//      it only the first family and it silently measures with a
//      different face wherever that family has no glyph — which is every
//      Tibetan syllable in this app.
//
//   2. Everything is prepared once at a 100px reference size and the
//      query is scaled, never re-prepared. prepare() is the expensive
//      half (segmentation + canvas measurement); layout() is arithmetic.
//      Text wrapping is linear in the font size, so a reader walking the
//      size control from 17px to 31px pays for preparation once and then
//      eight multiplications. This is the whole reason zoom can be
//      instant.
//
//   3. white-space and letter-spacing are read from the element too.
//      The reading surface sets `white-space: pre-wrap` on every content
//      field (authored line breaks are meaning, not formatting), and the
//      labels carry letter-spacing in em. Measuring either as its
//      default gives a plausible, wrong answer.
//
// Nothing here is load-bearing for reading: if Intl.Segmenter or canvas
// is missing, or a measurement throws, every entry point returns null
// and the caller falls back to what the browser would have done anyway.

import { prepareWithSegments, layout, measureNaturalWidth, clearCache }
  from './vendor/pretext/layout.js';

const REF = 100;       // reference font size, px — see discipline 2
const CACHE_MAX = 800; // prepared handles held before we start over

const cache = new Map();

let supported = null;
function available() {
  if (supported === null) {
    supported = typeof Intl !== 'undefined'
      && typeof Intl.Segmenter === 'function'
      && typeof document !== 'undefined'
      && typeof document.createElement('canvas').getContext === 'function';
  }
  return supported;
}

// A face that arrives after we measured makes every cached width a lie.
// Fonts are vendored and precached, so this fires once on a cold visit.
export function invalidate() {
  cache.clear();
  try { clearCache(); } catch { /* nothing prepared yet */ }
}

if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(invalidate, () => {});
  document.fonts.addEventListener?.('loadingdone', invalidate);
}

// ── Reading a style ─────────────────────────────────────────────────
// One getComputedStyle for everything pretext needs, plus the box
// padding a caller may want to add back. Callers hold onto the result
// and reuse it across many strings — that is the point.
export function styleOf(el) {
  const cs = getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize) || 0;
  if (!fontSize) return null;

  // Canvas font shorthand: style, weight, size, family — in that order,
  // with the family chain verbatim (discipline 1).
  const bits = [];
  if (cs.fontStyle && cs.fontStyle !== 'normal') bits.push(cs.fontStyle);
  if (cs.fontWeight && cs.fontWeight !== '400' && cs.fontWeight !== 'normal') {
    bits.push(cs.fontWeight);
  }
  bits.push(REF + 'px');
  bits.push(cs.fontFamily);
  const font = bits.join(' ');

  // line-height resolves to px wherever the tokens set a multiplier,
  // which is everywhere in this app. 'normal' is the font's own metric,
  // which pretext does not model — approximate it and say so.
  const rawLh = parseFloat(cs.lineHeight);
  const exact = Number.isFinite(rawLh);
  const lineHeight = exact ? rawLh : fontSize * 1.2;

  const ls = parseFloat(cs.letterSpacing);
  const letterSpacing = Number.isFinite(ls) ? ls : 0;

  const whiteSpace = cs.whiteSpace === 'pre-wrap' || cs.whiteSpace === 'pre-line'
    ? 'pre-wrap' : 'normal';
  const wordBreak = cs.wordBreak === 'keep-all' ? 'keep-all' : 'normal';

  return {
    font,
    fontSize,
    lineHeight,
    letterSpacing,
    whiteSpace,
    wordBreak,
    exact,
    transform: cs.textTransform,
    // Chrome the caller adds around the text, so a chip or a padded
    // panel can be sized from the same measurement.
    padX: (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
      + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0),
    padY: (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
      + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0),
    key: font + '|' + whiteSpace + '|' + wordBreak + '|'
      + (letterSpacing / fontSize).toFixed(5),
  };
}

// CSS text-transform happens before line breaking, so measure what the
// reader will actually see.
function shown(text, transform) {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

function prepared(text, style) {
  const key = style.key + ' ' + text;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (cache.size >= CACHE_MAX) invalidate();
  let value = null;
  try {
    value = prepareWithSegments(text, style.font, {
      whiteSpace: style.whiteSpace,
      wordBreak: style.wordBreak,
      // Prepared at REF px, so the spacing has to be at REF px too.
      letterSpacing: style.letterSpacing * (REF / style.fontSize),
    });
  } catch {
    value = null; // unmeasurable text is not a reason to stop reading
  }
  cache.set(key, value);
  return value;
}

// ── The two questions worth asking ──────────────────────────────────

// How tall is this text in a column this wide? Returns null when the
// measurement is unavailable — the caller must have a way to not care.
export function heightOf(text, style, width) {
  if (!available() || !style || !text || !(width > 0)) return null;
  const handle = prepared(shown(text, style.transform), style);
  if (!handle) return null;
  const s = REF / style.fontSize;                 // into reference space
  try {
    const r = layout(handle, width * s, style.lineHeight * s);
    // An empty paragraph still occupies one line in a browser.
    const lineCount = Math.max(1, r.lineCount);
    return { height: (r.height || style.lineHeight * s) / s, lineCount };
  } catch {
    return null;
  }
}

// How wide does this text want to be before anything wraps it? This is
// the multiline shrink-wrap the platform has never offered.
export function widthOf(text, style) {
  if (!available() || !style || !text) return null;
  const handle = prepared(shown(text, style.transform), style);
  if (!handle) return null;
  try {
    return measureNaturalWidth(handle) / (REF / style.fontSize);
  } catch {
    return null;
  }
}

export function isAvailable() { return available(); }
