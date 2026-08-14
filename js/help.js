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

import { t } from './i18n.js';

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
function onScreen(node) {
  if (!node) return false;
  if (node.offsetParent === null && getComputedStyle(node).position !== 'fixed') return false;
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Greedy row packing. Every label wants to be centred over the control
// it names; where two would touch, the later one steps back a row. Rows
// build outward from the bar, so the row nearest the controls is the
// fullest and the eye travels the shortest distance in the common case.
// `dir` is +1 for labels hanging below the header, -1 for labels
// standing above the bottom bar.
function place(targets, anchor, dir, chips, lines) {
  const rows = [];
  const made = [];

  for (const target of [...targets].sort((a, b) => a.cx - b.cx)) {
    const chip = el('span', 'help-chip', chips);
    chip.textContent = target.text;
    // Measured, not guessed: the words are translatable and the type
    // scale is the reader's.
    const w = chip.offsetWidth;
    const h = chip.offsetHeight;

    const left = Math.max(PAD, Math.min(
      Math.round(target.cx - w / 2), window.innerWidth - w - PAD));
    const span = [left - GUTTER, left + w + GUTTER];

    let row = 0;
    while ((rows[row] || []).some(([a, b]) => span[0] < b && span[1] > a)) row++;
    (rows[row] = rows[row] || []).push(span);

    const top = dir > 0
      ? anchor + GAP + row * (h + ROW_GAP)
      : anchor - GAP - h - row * (h + ROW_GAP);
    chip.style.left = `${left}px`;
    chip.style.top = `${top}px`;
    made.push({ target, top, h });
  }

  // The hairlines last, once every label knows where it stands and how
  // far it has to reach — and into a layer beneath the labels, so a line
  // passing an intervening row is hidden by that label rather than drawn
  // through its words.
  for (const { target, top, h } of made) {
    const from = dir > 0 ? target.edge : top + h;
    const to = dir > 0 ? top : target.edge;
    const line = el('span', 'help-line', lines);
    line.style.left = `${Math.round(target.cx)}px`;
    line.style.top = `${Math.round(from)}px`;
    line.style.height = `${Math.max(0, Math.round(to - from))}px`;
  }
}

// Fill the overlay against the screen as it stands. The container must
// already be shown — a hidden element measures zero, and every position
// here comes from a real measurement. Returns how many controls were
// named, so the caller can tell an empty screen from a full one.
export function layout(marks) {
  marks.textContent = '';
  const lines = el('div', 'help-lines', marks);
  const chips = el('div', 'help-chips', marks);

  const zones = { header: [], bar: [] };
  for (const target of TARGETS) {
    const node = document.querySelector(target.sel);
    if (!onScreen(node)) continue;
    const r = node.getBoundingClientRect();
    zones[target.zone].push({
      text: t(target.key),
      cx: r.left + r.width / 2,
      // The hairline meets the control on the side the label is on.
      edge: target.zone === 'header' ? r.bottom : r.top,
    });
  }

  const header = document.querySelector('.app-header');
  const bar = document.querySelector('.bottom-bar');
  if (zones.header.length && onScreen(header)) {
    place(zones.header, header.getBoundingClientRect().bottom, 1, chips, lines);
  }
  // Anchored to the whole bar, not to the row of controls: a return bar
  // or an invitation may be standing above them, and the labels belong
  // clear of it.
  if (zones.bar.length && bar) {
    place(zones.bar, bar.getBoundingClientRect().top, -1, chips, lines);
  }

  el('p', 'help-hint', marks).textContent = t('helpDismiss');
  return zones.header.length + zones.bar.length;
}
