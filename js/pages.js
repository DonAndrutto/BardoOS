// Page mode: the text turned like a book's pages instead of scrolled.
//
// Ported from the owner's Ngöndro reader (DonAndrutto/Ngondro, "Port
// Ewam page reading mode", "Match Ewam page-mode gesture mechanics"),
// which is itself the Ewam reader's: the same mechanism, so the three
// apps turn their pages alike.
//
// The mechanism is the browser's own. Each portion of the text — the
// title, every section, the links at its foot — is a *unit*, and only the
// unit being read is laid out. It is set in native CSS columns exactly
// one page wide and one page tall, so the browser fragments the text at
// line boxes: a page always ends on a whole line, a paragraph taller
// than the screen simply continues on the next page, and a heading is
// never left alone at the foot of one. Turning a page is a transform of
// one column's width — nothing animates, nothing is rebuilt, and the
// reflows the controls cause (type size, layers, Voice mode, fullscreen,
// a turned phone) are just the browser re-fragmenting the same nodes.
//
// The reader's place survives every such reflow the way it does in the
// scrolling reader (js/anchor.js), held by *text* rather than by a
// number: the first character showing on the page is remembered, and
// after the change the page that holds that character is the one shown.
// A page index alone would not do — at a larger size page 3 of 5 is
// somewhere else entirely.

import { state, effectiveFontSize } from './store.js';
import { t } from './i18n.js';

const GAP = 32;   // between columns: wider than the shell's side padding,
                  // so the next page never shows at the edge
const EDGE = 0.25; // the fraction of the page at either side a tap turns

const $ = (id) => document.getElementById(id);

const page = { unit: 0, index: 0, count: 1, stride: 0, anchor: null };
let units = [];
let isText = () => false;
let isBlocked = () => false;
let onChange = () => {};
let layoutFrame = 0;
let gestures = null;

// Page mode is a reading mode: it applies to a text, never to the
// doorway or a gallery, which go on scrolling as they always did.
export function active() {
  return state.readingMode === 'pages' && isText();
}

// ── Units ───────────────────────────────────────────────────────────
// What the language toggles and Voice mode hide is hidden in CSS with
// its nodes intact, so it cannot be asked whether it is laid out — in
// page mode nothing but the current unit is. The rule is restated here
// instead: a portion is shown when it holds a field of a layer that is
// shown. In Guide mode a section keeps its heading whatever is toggled,
// as css/app.css has it.
function shown(unit, reader) {
  if (!unit.matches('header.text-title, section[data-section-id]')) return true;
  if (unit.matches('section') && !document.body.classList.contains('voice')) return true;
  const fields = [['show-bo', '.bo'], ['show-phon', '.phon'], ['show-en', '.en']]
    .filter(([cls]) => reader.classList.contains(cls)).map(([, sel]) => sel);
  return fields.length > 0 && unit.querySelector(fields.join(',')) !== null;
}

// For anything that lists the portions (the contents sheet): in page
// mode every portion but one is display:none, so `offsetParent` cannot
// say which the reader could see.
export function visible(unit) {
  return shown(unit, $('reader'));
}

function collect() {
  const reader = $('reader');
  units = Array.from(reader.children).filter((node) =>
    node.matches('header.text-title, section[data-section-id], .text-foot') && shown(node, reader));
  return units;
}

function blockNode(id) {
  return id ? document.querySelector(`#reader [data-block-id="${CSS.escape(id)}"]`) : null;
}

// ── Anchors ─────────────────────────────────────────────────────────
function characterRange(node, offset) {
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.length) return null;
  const range = document.createRange();
  const start = Math.min(offset, node.length - 1);
  range.setStart(node, start);
  range.setEnd(node, Math.min(node.length, start + 1));
  return range;
}

function anchorOf(block, range, unit) {
  const section = (block || unit)?.closest?.('section[data-section-id]');
  return {
    block,
    blockId: block?.dataset?.blockId || null,
    sectionId: section ? section.dataset.sectionId : null,
    range,
  };
}

// The first character on the page being read, keeping its DOM identity
// so that after a reflow it can be found exactly where it went.
export function capturePageAnchor() {
  const unit = units[page.unit];
  if (!unit || !unit.isConnected) return null;
  const area = $('reader').getBoundingClientRect();
  const left = area.left, right = area.right;
  const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.length || !node.data.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    if (!Array.from(range.getClientRects()).some((r) => r.width && r.right > left && r.left < right &&
        r.bottom > area.top && r.top < area.bottom)) continue;
    // The first character on this column, by binary search.
    let lo = 0, hi = node.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (characterRange(node, mid).getBoundingClientRect().right <= left) lo = mid + 1;
      else hi = mid;
    }
    return anchorOf(node.parentElement.closest('[data-block-id]'), characterRange(node, lo), unit);
  }
  const block = Array.from(unit.querySelectorAll('[data-block-id]')).find((b) =>
    Array.from(b.getClientRects()).some((r) => r.right > left && r.left < right));
  return anchorOf(block || null, null, unit);
}

// In the scrolling reader: what sits at the reader's line, to the
// character where the platform can say so.
export function captureScrollAnchor(line) {
  const reader = $('reader');
  const rr = reader.getBoundingClientRect();
  for (const dy of [3, 40, 96]) {
    const y = line + dy;
    if (y > innerHeight - 70) break;
    const hit = document.elementsFromPoint(rr.left + rr.width / 2, y)
      .find((n) => n.closest && n.closest('#reader'));
    const block = hit && hit.closest('#reader [data-block-id]');
    if (!block) continue;
    const bounds = block.getBoundingClientRect();
    for (const x of [bounds.left + bounds.width * 0.5, bounds.left + bounds.width * 0.25, bounds.left + 12]) {
      let range = null;
      if (document.caretPositionFromPoint) {
        const caret = document.caretPositionFromPoint(x, y);
        if (caret) range = characterRange(caret.offsetNode, caret.offset);
      } else if (document.caretRangeFromPoint) {
        const caret = document.caretRangeFromPoint(x, y);
        if (caret) range = characterRange(caret.startContainer, caret.startOffset);
      }
      if (range && block.contains(range.startContainer)) return anchorOf(block, range);
    }
    return anchorOf(block, null);
  }
  return null;
}

// The element an anchor still points at: the same node if nothing was
// rebuilt, its replacement by id if something was (Voice mode).
// A page that begins on a heading has no block under it; its portion
// stands in.
export function resolve(anchor) {
  if (!anchor) return null;
  if (anchor.block && anchor.block.isConnected) return anchor.block;
  return blockNode(anchor.blockId) || (anchor.sectionId
    ? document.querySelector(`#reader section[data-section-id="${CSS.escape(anchor.sectionId)}"]`)
    : null);
}

// ── Layout ──────────────────────────────────────────────────────────
// Where the page stands: under the header (gone in fullscreen and in
// Voice mode) and above the whole bottom bar, which carries the page
// controls and anything standing above them.
function measure() {
  const shell = document.querySelector('.shell');
  const reader = $('reader');
  const header = document.querySelector('.app-header');
  const headerShown = header && header.offsetParent !== null;
  const top = (headerShown ? header.getBoundingClientRect().bottom : 0) + 12;
  // The bar's own top padding is the margin below the page.
  const barTop = document.querySelector('.bottom-bar').getBoundingClientRect().top;
  const height = Math.max(32, barTop - top);
  shell.style.setProperty('--page-top', top + 'px');
  shell.style.setProperty('--page-height', height + 'px');
  // A very short landscape screen must still fit the largest heading's
  // line on a page, so the type gives way before the page does.
  const cap = Math.max(4, Math.floor((height - 8) / 3.7));
  reader.style.setProperty('--size-base', Math.min(effectiveFontSize(), cap) + 'px');
  const cs = getComputedStyle(reader);
  const width = reader.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  reader.style.setProperty('--page-width', width + 'px');
  page.stride = width + GAP;
}

export function layout(anchor = null) {
  if (!active()) return;
  collect();
  if (!units.length) return;
  const block = resolve(anchor);
  let target = block ? units.findIndex((u) => u.contains(block)) : -1;
  if (target < 0 && anchor?.sectionId) {
    target = units.findIndex((u) => u.dataset.sectionId === anchor.sectionId);
  }
  if (target >= 0) page.unit = target;
  page.unit = Math.max(0, Math.min(units.length - 1, page.unit));
  const unit = units[page.unit];
  for (const node of $('reader').children) {
    node.classList.toggle('page-current', node === unit);
    if (node !== unit) node.style.transform = '';
  }
  measure();
  page.count = Math.max(1, Math.ceil((unit.scrollWidth + GAP - 1) / page.stride));
  if (target >= 0) {
    const live = anchor.range && anchor.range.startContainer.isConnected ? anchor.range : null;
    const rect = live?.getClientRects()[0] || block?.getClientRects()[0];
    if (rect) page.index = Math.floor((rect.left - unit.getBoundingClientRect().left + 1) / page.stride);
  }
  page.index = Math.max(0, Math.min(page.count - 1, page.index));
  show(anchor);
}

// The reader's place is the first character of the page they turned to,
// and it is kept as such through any number of reflows: re-taking it
// after each one would walk it backwards — the first character of the
// page that now holds the place is earlier text — a little on every tap
// of the size control. Only a page the reader chose resets it.
function show(held = null) {
  const unit = units[page.unit];
  if (!unit) return;
  unit.style.transform = `translateX(${-page.index * page.stride}px)`;
  const position = $('pagePosition');
  position.textContent = `${page.index + 1} / ${page.count}`;
  position.setAttribute('aria-label', t('pagePosition')
    .replace('{page}', page.index + 1).replace('{count}', page.count)
    .replace('{section}', page.unit + 1).replace('{sections}', units.length));
  $('btnPrevPage').disabled = page.unit === 0 && page.index === 0;
  $('btnNextPage').disabled = page.unit === units.length - 1 && page.index === page.count - 1;
  page.anchor = held && resolve(held) ? held : capturePageAnchor();
  onChange();
}

export function queueLayout() {
  if (!active() || layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    layout(page.anchor);
  });
}

// Run `change`, and show the page that holds the character the reader
// was on.
export function keep(change) {
  const anchor = page.anchor && resolve(page.anchor) ? page.anchor : capturePageAnchor();
  change();
  layout(anchor);
}

// ── Turning ─────────────────────────────────────────────────────────
export function turn(direction) {
  if (!active()) return;
  const next = page.index + direction;
  if (next >= 0 && next < page.count) {
    page.index = next;
    show();
    return;
  }
  const unit = page.unit + direction;
  if (unit < 0 || unit >= units.length) return;
  page.unit = unit;
  page.index = direction < 0 ? Number.MAX_SAFE_INTEGER : 0;
  layout();
}

export function toStart() {
  page.unit = 0;
  page.index = 0;
  layout();
}

export function toSection(sectionId) {
  collect();
  const i = units.findIndex((u) => u.dataset.sectionId === sectionId);
  if (i < 0) return;
  page.unit = i;
  page.index = 0;
  layout();
}

export function toBlock(blockId) {
  const block = blockNode(blockId);
  if (block) layout(anchorOf(block, null));
  else toStart();
}

export function currentSectionId() {
  return units[page.unit]?.dataset.sectionId || null;
}

// ── The mode itself ─────────────────────────────────────────────────
// Entering lays out the page holding `anchor`; leaving puts every unit
// back as the scrolling reader had it.
export function sync(anchor = null) {
  const paged = active();
  document.documentElement.classList.toggle('paged-reading', paged);
  $('btnPage').classList.toggle('active', state.readingMode === 'pages');
  $('btnPage').setAttribute('aria-pressed', String(state.readingMode === 'pages'));
  $('pageNav').hidden = !paged;
  for (const id of ['btnSlower', 'btnPlay', 'btnFaster']) $(id).disabled = paged;
  if (gestures) gestures.syncMode();
  if (paged) {
    window.scrollTo(0, 0);
    layout(anchor);
    return;
  }
  for (const node of $('reader').children) {
    node.classList.remove('page-current');
    node.style.transform = '';
  }
  $('reader').style.removeProperty('--size-base');
  $('reader').style.removeProperty('--page-width');
}

/* EWAM_READER_GESTURES_START */
// Shared touch behavior for the readers. App-specific navigation and sizing
// are callbacks so Ngondro and Vajracchedika can use the same implementation.
function installReaderGestures(area, { isPageMode, isBlocked, turnPage, resizeText }) {
  let gesture = null;
  let ignoreClickUntil = 0;
  const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY);
  const eligible = (target) => isPageMode() && !isBlocked(target) && window.getSelection().isCollapsed;
  const consume = (event) => {
    if (event.cancelable) event.preventDefault();
    ignoreClickUntil = performance.now() + 700;
  };

  function onTouchStart(event) {
    const touches = [...event.touches];
    if (!eligible(event.target) || touches.some((touch) => !area.contains(touch.target)) || touches.length > 2) {
      gesture = { kind: 'ignore' };
      return;
    }
    // A pinch never becomes a swipe when one finger lifts first.
    if (gesture?.kind === 'pinch' || gesture?.kind === 'ignore') return;
    if (touches.length === 2) {
      gesture = { kind: 'pinch', initial: distance(touches), last: distance(touches), finished: false };
      consume(event);
    } else if (touches.length === 1) {
      const touch = touches[0];
      gesture = { kind: 'swipe', id: touch.identifier, x: touch.clientX, y: touch.clientY,
        lastX: touch.clientX, lastY: touch.clientY, started: performance.now(),
        paged: isPageMode(), vertical: false };
    }
  }

  function onTouchMove(event) {
    if (!gesture || gesture.kind === 'ignore') return;
    if (!eligible(event.target)) { gesture = { kind: 'ignore' }; return; }
    const touches = [...event.touches];
    if (gesture.kind === 'pinch') {
      consume(event);
      if (!gesture.finished && touches.length === 2) gesture.last = distance(touches);
      return;
    }
    const touch = touches.find((t) => t.identifier === gesture.id);
    if (!touch) return;
    gesture.lastX = touch.clientX;
    gesture.lastY = touch.clientY;
    const dx = Math.abs(gesture.lastX - gesture.x), dy = Math.abs(gesture.lastY - gesture.y);
    if (dy > 12 && dy > dx) gesture.vertical = true;
    if (gesture.paged && !gesture.vertical && dx > 8 && dx > dy * 1.4) consume(event);
  }

  function onTouchEnd(event) {
    if (!gesture) return;
    if (gesture.kind === 'pinch') {
      consume(event);
      if (!gesture.finished && eligible(event.target)) {
        gesture.finished = true;
        const delta = gesture.last - gesture.initial;
        if (Math.abs(delta) >= Math.max(12, gesture.initial * 0.08)) resizeText(delta > 0 ? 1 : -1);
      }
      if (!event.touches.length) gesture = null;
      return;
    }
    if (gesture.kind === 'swipe' && !event.touches.length) {
      const touch = [...event.changedTouches].find((t) => t.identifier === gesture.id);
      const dx = (touch?.clientX ?? gesture.lastX) - gesture.x;
      const dy = (touch?.clientY ?? gesture.lastY) - gesture.y;
      if (gesture.paged && isPageMode() && !gesture.vertical && eligible(event.target) &&
          performance.now() - gesture.started < 800 && Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        consume(event);
        turnPage(dx < 0 ? 1 : -1);
      }
    }
    if (!event.touches.length) gesture = null;
  }

  function onTouchCancel() {
    if (gesture?.kind === 'pinch') ignoreClickUntil = performance.now() + 700;
    gesture = null;
  }

  // Some browsers synthesize an edge-tap click after a swipe/pinch. Do not
  // turn a second page; ordinary taps and keyboard activation still work.
  function onClick(event) {
    if (event.detail && performance.now() < ignoreClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  // Non-passive touch listeners make the browser wait for JavaScript before
  // scrolling. Register them only while pages own the gesture, and remove
  // them entirely when scrolling is native again.
  const listeners = [
    ['touchstart', onTouchStart, { passive: false }],
    ['touchmove', onTouchMove, { passive: false }],
    ['touchend', onTouchEnd, { passive: false }],
    ['touchcancel', onTouchCancel, { passive: true }],
    ['click', onClick, { capture: true }],
  ];
  let enabled = false;
  function syncMode() {
    const next = isPageMode();
    if (next === enabled) return;
    gesture = null;
    ignoreClickUntil = 0;
    enabled = next;
    for (const [type, listener, options] of listeners) {
      if (enabled) area.addEventListener(type, listener, options);
      else area.removeEventListener(type, listener, options);
    }
  }
  syncMode();
  return { syncMode };
}
/* EWAM_READER_GESTURES_END */

// ── Input ───────────────────────────────────────────────────────────
// `blocked` is the app's word on whether an overlay or a control has the
// reader's attention; `resizeText` steps the type; `changed` hears every
// page shown.
export function init({ text, blocked, resizeText, changed }) {
  isText = text;
  isBlocked = (target) => Boolean(target.closest(
    'input,textarea,select,[contenteditable="true"],a,button,[role="dialog"],.nav,.lang-menu')) || blocked();
  onChange = changed;
  const shell = document.querySelector('.shell');

  gestures = installReaderGestures(shell, {
    isPageMode: active,
    isBlocked,
    turnPage: turn,
    resizeText,
  });

  // A tap at either edge of the page turns it; the middle is the text's.
  shell.addEventListener('click', (e) => {
    if (!active() || isBlocked(e.target) || !window.getSelection().isCollapsed) return;
    const bounds = shell.getBoundingClientRect();
    const fraction = (e.clientX - bounds.left) / bounds.width;
    if (fraction < EDGE) turn(-1);
    else if (fraction > 1 - EDGE) turn(1);
  });

  document.addEventListener('keydown', (e) => {
    const button = e.target.closest && e.target.closest('button');
    if (button && (e.key === ' ' || e.key === 'Enter')) return;
    if (!active() || isBlocked(button?.parentElement || e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    const direction = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)
      ? (e.shiftKey && e.key === ' ' ? -1 : 1)
      : ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
    if (direction) { e.preventDefault(); turn(direction); }
    else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      page.index = e.key === 'Home' ? 0 : page.count - 1;
      show();
    }
  });

  let lastWheel = 0;
  window.addEventListener('wheel', (e) => {
    if (!active() || isBlocked(e.target) || e.ctrlKey) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) >= 10 && performance.now() - lastWheel > 300) {
      lastWheel = performance.now();
      turn(delta > 0 ? 1 : -1);
    }
  }, { passive: false });

  window.addEventListener('resize', queueLayout);
  window.visualViewport?.addEventListener('resize', queueLayout);
  if (document.fonts) document.fonts.ready.then(queueLayout);
}
