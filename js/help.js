// What the controls do.
//
// Owner's direction (2026-08-14): a question mark in the header which,
// tapped, steps the page back and puts a word or two beside every
// persistent control, so the whole instrument explains itself in one
// glance and then gets out of the way. Nearly every control here is an
// icon — a diamond, a moon, an expanding square — and nothing on the
// screen has ever said what they are.
//
// This module is the layout and nothing else. It holds no state, reads
// no setting, and changes nothing: js/app.js owns opening and closing,
// because that half belongs with the deity viewer's discipline — hold
// the auto-scroll, keep the reading position, give the focus back.
//
// Why the words cannot simply sit under their buttons: on a 360px phone
// the bottom bar carries fourteen controls on a single row that never
// wraps (`.bar-inner` under 40rem in css/app.css), each 23px wide, and a
// word like AUTO-SCROLL is sixty. Even on a wide screen the buttons
// within a group touch. So the labels are packed into rows — each
// centred over the control it names, each dropped to it by a hairline —
// and the packing is measured afresh every time it opens, because which
// controls exist at all depends on the view, on the text, and on the
// platform.
//
// The packing needs to know how wide each word is, and it used to find
// out the only way the platform offered: put the label in the page, read
// `offsetWidth`, position it, and repeat. That is sixteen writes and
// thirty-two reads, alternating — the browser is forced to lay the whole
// page out again between every one of them, and the page underneath is a
// text of ninety blocks. Pretext answers the same question from the
// font itself (js/measure.js): one style read for the shape a chip has,
// then arithmetic for all sixteen words. Nothing is in the document
// until every position is known, and then it all goes in at once.
//
// Where pretext cannot run, the old read-back is still here, and the
// labels land in the same places by the slower road.

import { t } from './i18n.js';
import { styleOf, widthOf, isAvailable } from './measure.js';

const PAD = 6;      // never nearer the screen edge than this
const GUTTER = 8;   // clear space demanded between two labels in a row
const GAP = 6;      // between a bar and the nearest row of labels
const ROW_GAP = 4;  // between stacked rows

// Every persistent control, and the word or two that names it. Held as
// selectors rather than elements: the overlay is built fresh on each
// opening, against whatever is actually on the screen at the time.
// `interfaceLanguage` and `contents` are the app's own existing strings
// — the label a reader sees here is the one the app already uses.
const TARGETS = [
  { sel: '#btnMenu', key: 'helpTexts', zone: 'header' },
  { sel: '#btnHome', key: 'helpHome', zone: 'header' },
  { sel: '.donate-link', key: 'helpDonate', zone: 'header' },
  { sel: '#btnUiLang', key: 'interfaceLanguage', zone: 'header' },

  { sel: '#btnSlower', key: 'helpSlower', zone: 'bar' },
  { sel: '#btnPlay', key: 'helpAutoScroll', zone: 'bar' },
  { sel: '#btnFaster', key: 'helpFaster', zone: 'bar' },
  { sel: '#btnPage', key: 'helpPages', zone: 'bar' },
  { sel: '#btnPrevPage', key: 'pagePrevious', zone: 'bar' },
  { sel: '#btnNextPage', key: 'pageNext', zone: 'bar' },
  { sel: '#btnVoice', key: 'helpVoice', zone: 'bar' },
  { sel: '#btnFs', key: 'helpFullScreen', zone: 'bar' },
  { sel: '#btnTheme', key: 'helpTheme', zone: 'bar' },
  { sel: '#btnContents', key: 'contents', zone: 'bar' },
  { sel: '#btnBo', key: 'helpTibetan', zone: 'bar' },
  { sel: '#btnPhon', key: 'helpPhonetics', zone: 'bar' },
  { sel: '#btnEn', key: 'helpEnglish', zone: 'bar' },
  { sel: '#btnSmaller', key: 'helpSmaller', zone: 'bar' },
  { sel: '#btnLarger', key: 'helpLarger', zone: 'bar' },
];

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

// On the screen, and big enough to point at. `offsetParent` is null for
// anything displaying none — which is how the bar stands its reading
// controls down off a text, how PHO leaves a text that is never recited,
// how the size controls leave the doorway, and how the whole header goes
// in Voice mode. Nothing is ever named that the reader cannot see.
// Returns the rect, so no caller has to ask for it a second time.
function onScreen(node) {
  if (!node) return null;
  if (node.offsetParent === null && getComputedStyle(node).position !== 'fixed') return null;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}

// One chip, put in the page so the cascade has reached it, read once for
// everything the measurement needs: the face, the size, the tracking,
// the uppercasing, and the padding and border the words sit inside.
// Every other chip in this overlay has the same shape, so this is read
// once and spent sixteen times.
function chipShape(chips) {
  const probe = el('span', 'help-chip', chips);
  probe.textContent = 'M';
  const style = isAvailable() ? styleOf(probe) : null;
  probe.remove();
  return style;
}

// Greedy row packing. Every label wants to be centred over the control
// it names; where two would touch, the later one steps back a row. Rows
// build outward from the bar, so the row nearest the controls is the
// fullest and the eye travels the shortest distance in the common case.
// `dir` is +1 for labels hanging below the header, -1 for labels
// standing above the bottom bar.
function place(targets, anchor, dir, chips, lines, shape) {
  const rows = [];
  const made = [];
  // Every chip is one line of nowrap text in the same box, so its height
  // is the same number for all of them and is known before any of them
  // exists. Where the measurement is unavailable the chip is read back
  // the old way, one at a time.
  const chipH = shape ? shape.lineHeight + shape.padY : 0;

  const chipFrag = document.createDocumentFragment();
  const lineFrag = document.createDocumentFragment();

  for (const target of [...targets].sort((a, b) => a.cx - b.cx)) {
    const chip = el('span', 'help-chip');
    chip.textContent = target.text;

    let w;
    let h;
    const measured = shape ? widthOf(target.text, shape) : null;
    if (measured !== null) {
      // Plus the tracking after the final glyph, which CSS puts inside
      // the box and a pure advance measurement does not. Checked against
      // the browser across all sixteen labels: within a pixel or two,
      // and the packer keeps a gutter eight pixels wide, so a label can
      // never end up sitting on its neighbour.
      w = Math.ceil(measured + shape.padX + shape.letterSpacing);
      h = Math.ceil(chipH);
    } else {
      chips.appendChild(chip); // no measurement without a layout here
      w = chip.offsetWidth;
      h = chip.offsetHeight;
    }

    const left = Math.max(PAD, Math.min(
      Math.round(target.cx - w / 2), window.innerWidth - w - PAD));
    const span = [left - GUTTER, left + w + GUTTER];

    let row = 0;
    while ((rows[row] || []).some(([a, b]) => span[0] < b && span[1] > a)) row++;
    (rows[row] = rows[row] || []).push(span);

    const top = dir > 0
      ? anchor + GAP + row * (h + ROW_GAP)
      : anchor - GAP - h - row * (h + ROW_GAP);
    // The geometry goes in as two custom properties and css/app.css
    // turns them into a position: the stylesheet keeps saying how a chip
    // is placed, and this only says where.
    chip.style.setProperty('--x', `${left}px`);
    chip.style.setProperty('--y', `${top}px`);
    if (chip.parentNode !== chips) chipFrag.appendChild(chip);
    made.push({ target, top, h });
  }

  // The hairlines last, once every label knows where it stands and how
  // far it has to reach — and into a layer beneath the labels, so a line
  // passing an intervening row is hidden by that label rather than drawn
  // through its words.
  for (const { target, top, h } of made) {
    const from = dir > 0 ? target.edge : top + h;
    const to = dir > 0 ? top : target.edge;
    const line = el('span', 'help-line');
    line.style.setProperty('--x', `${Math.round(target.cx)}px`);
    line.style.setProperty('--y', `${Math.round(from)}px`);
    line.style.setProperty('--h', `${Math.max(0, Math.round(to - from))}px`);
    lineFrag.appendChild(line);
  }

  // One insertion each, at the end: nothing was read back between two
  // writes, so the browser lays this overlay out exactly once.
  chips.appendChild(chipFrag);
  lines.appendChild(lineFrag);
}

// Fill the overlay against the screen as it stands. The container must
// already be shown — a hidden element measures zero, and every position
// here comes from a real measurement. Returns how many controls were
// named, so the caller can tell an empty screen from a full one.
// Prepare every label before anyone asks for one.
//
// Pretext splits its work in two: `prepare()` segments and measures the
// text with the font engine, and after that a width is arithmetic. That
// suits a reader walking the size control, where the same words are
// asked about again and again — but the help overlay asks about sixteen
// strings once and then not again for minutes, so the first opening was
// paying the whole preparation with the reader's finger on the button.
// It was measurably slower than the old read-back for exactly that one
// opening, and much faster for every one after.
//
// So the strings are prepared when nothing else is happening. The probe
// is measured inside the overlay while it is still hidden, which gives
// the same face, size and tracking the live chip has — and if it somehow
// does not, the only cost is that the cache misses and the first opening
// measures as it would have anyway.
export function warm(marks) {
  if (!marks || !isAvailable()) return;
  const probe = el('span', 'help-chip', marks);
  probe.textContent = 'M';
  const style = styleOf(probe);
  probe.remove();
  if (!style) return;
  for (const target of TARGETS) widthOf(t(target.key), style);
}

export function layout(marks) {
  marks.textContent = '';
  const lines = el('div', 'help-lines', marks);
  const chips = el('div', 'help-chips', marks);

  // Everything this needs from the page, read in one go, before a single
  // thing is written: where each control stands, where the header and
  // the bar are, and the shape a chip has.
  const zones = { header: [], bar: [] };
  for (const target of TARGETS) {
    const r = onScreen(document.querySelector(target.sel));
    if (!r) continue;
    zones[target.zone].push({
      text: t(target.key),
      cx: r.left + r.width / 2,
      // The hairline meets the control on the side the label is on.
      edge: target.zone === 'header' ? r.bottom : r.top,
    });
  }
  const headerRect = onScreen(document.querySelector('.app-header'));
  const bar = document.querySelector('.bottom-bar');
  const barTop = bar ? bar.getBoundingClientRect().top : null;
  const shape = chipShape(chips);

  if (zones.header.length && headerRect) {
    place(zones.header, headerRect.bottom, 1, chips, lines, shape);
  }
  // Anchored to the whole bar, not to the row of controls: a return bar
  // or an invitation may be standing above them, and the labels belong
  // clear of it.
  if (zones.bar.length && barTop !== null) {
    place(zones.bar, barTop, -1, chips, lines, shape);
  }

  el('p', 'help-hint', marks).textContent = t('helpDismiss');
  return zones.header.length + zones.bar.length;
}
