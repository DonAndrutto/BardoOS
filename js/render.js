// Rendering. The renderer reads data; it never interprets prose.
// Layer treatments per docs/layer-palette.md (approved):
//   L0 rubric — quiet, muted, centered narrow; never spoken;
//               in Voice mode it collapses to a thin peekable marker
//   L1 address — left-aligned run with gold rule + ◆ READ ALOUD label
//   L2 bardo recitation — framed panel, verse, BARDO RECITATION label
//   L3 living liturgy — centered, LITURGY label per run
//   L4 apparatus — titles / colophons, silent; absent in Voice mode
//
// Hidden content is not emitted (not merely display:none) so the
// auto-scroll geometry stays honest — inherited from the reference.

import { state } from './store.js';
import { cycleEntry } from './data.js';
import { t } from './i18n.js';

const RUN_LABELS = { L1: 'READ ALOUD', L2: 'BARDO RECITATION', L3: 'LITURGY' };
const TODO = 'TODO_CONTENT';

// Static icon markup only — never content (same discipline as the nav).
const ARROW_ICON =
  '<svg class="prayer-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
const LOCK_ICON =
  '<svg class="prayer-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
  '<path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

// Text goes in as data, comes out as DOM text nodes — no HTML parsing of
// content, ever. The only inline tokens are \n (verse lines), TODO_CONTENT
// (declared gaps, marked visibly rather than hidden), and **…** (emphasis,
// SCHEMA §4 — a paired marker, never interpreted as prose).
function fillInline(node, value) {
  const lines = String(value).split('\n');
  for (const line of lines) {
    const target = lines.length > 1 ? el('span', 'line', node) : node;
    line.split('**').forEach((seg, k) => {
      const dest = k % 2 ? el('strong', 'em', target) : target;
      seg.split(TODO).forEach((piece, j, pieces) => {
        if (piece) dest.appendChild(document.createTextNode(piece));
        if (j < pieces.length - 1) el('span', 'todo', dest).textContent = TODO;
      });
    });
  }
}

// Which of a block's fields the current toggles let through.
function visibleFields(block) {
  const fields = [];
  if (state.showBo && block.bo != null) fields.push('bo');
  // Rubric is never recited: no phonetics on L0 regardless of data.
  if (state.showPhon && block.phon != null && block.layer !== 'L0') fields.push('phon');
  if (state.showEn && block.en != null) fields.push('en');
  return fields;
}

// A block's prayerRef renders as a tappable link to that prayer —
// title from the manifest (the owner's words), never authored here.
// A ref to a still-forthcoming prayer shows locked, going nowhere.
function prayerRefEl(block) {
  const entry = cycleEntry(block.prayerRef);
  const title = entry && entry.title !== TODO ? entry.title : block.prayerRef;
  const wrap = el('div', 'prayer-ref');
  if (entry && entry.status === 'translated') {
    const btn = el('button', 'prayer-link', wrap);
    btn.type = 'button';
    btn.dataset.prayerRef = block.prayerRef;
    btn.innerHTML = ARROW_ICON;
    el('span', 'prayer-link-title', btn).textContent = title;
  } else {
    const span = el('span', 'prayer-link locked', wrap);
    span.innerHTML = LOCK_ICON;
    const body = el('span', 'prayer-link-body', span);
    el('span', 'prayer-link-title', body).textContent = title;
    el('small', 'prayer-link-note', body).textContent = t('forthcoming');
  }
  return wrap;
}

function blockEl(block, fields) {
  const div = el('div', `block layer-${block.layer} form-${block.form}`);
  div.dataset.blockId = block.id;
  for (const f of fields) {
    fillInline(el('div', f === 'bo' ? 'bo' : f, div), block[f]);
  }
  if (block.prayerRef) div.appendChild(prayerRefEl(block));
  return div;
}

// In Voice mode a rubric block collapses to a thin, identical marker.
// Tapping it peeks the rubric in place; the reading position never moves.
function collapsedL0(block, fields) {
  const wrap = el('div', 'block layer-L0 voice-collapsed');
  wrap.dataset.blockId = block.id;
  const btn = el('button', 'l0-marker', wrap);
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Guidance for the reader — not read aloud');
  el('span', 'l0-marker-line', btn);
  el('span', 'l0-marker-dot', btn).textContent = '·';
  el('span', 'l0-marker-line', btn);
  const peek = el('div', 'l0-peek', wrap);
  for (const f of fields) {
    fillInline(el('div', f === 'bo' ? 'bo' : f, peek), block[f]);
  }
  if (block.prayerRef) peek.appendChild(prayerRefEl(block));
  return wrap;
}

// Consecutive blocks of a spoken layer form one labeled run (the label
// appears once per run); consecutive refrain blocks inside a run share
// one framed panel that the auto-scroll engine holds on.
function renderBlocks(blocks, parent, sectionId) {
  const voice = state.mode === 'voice';
  let refrainN = 0;
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const fields = visibleFields(block);

    if (voice && block.layer === 'L4') { i++; continue; }
    if (fields.length === 0) { i++; continue; }

    if (voice && block.layer === 'L0') {
      parent.appendChild(collapsedL0(block, fields));
      i++;
      continue;
    }

    if (RUN_LABELS[block.layer]) {
      const layer = block.layer;
      const run = el('div', `run-${layer}`, parent);
      el('span', 'run-label', run).textContent = RUN_LABELS[layer];
      while (i < blocks.length && blocks[i].layer === layer) {
        if (blocks[i].refrain) {
          const group = el('div', 'refrain-group', run);
          group.dataset.refrainId = `${sectionId}-r${refrainN++}`;
          while (i < blocks.length && blocks[i].layer === layer && blocks[i].refrain) {
            const f = visibleFields(blocks[i]);
            if (f.length) group.appendChild(blockEl(blocks[i], f));
            i++;
          }
        } else {
          const f = visibleFields(blocks[i]);
          if (f.length) run.appendChild(blockEl(blocks[i], f));
          i++;
        }
      }
      continue;
    }

    parent.appendChild(blockEl(block, fields));
    i++;
  }
}

export function renderText(text, container) {
  container.textContent = '';

  const title = el('header', 'text-title', container);
  if (state.showBo && text.title.bo != null) fillInline(el('div', 'bo', title), text.title.bo);
  if (state.showEn && text.title.en != null) fillInline(el('div', 'en', title), text.title.en);

  for (const section of text.sections) {
    const sec = el('section', 'section', container);
    sec.dataset.sectionId = section.id;
    fillInline(el('h2', 'section-heading', sec), section.heading.en);
    renderBlocks(section.blocks, sec, section.id);
    // A section whose blocks are all hidden shows only its heading — in
    // Voice mode even that goes when nothing in it is spoken.
    if (state.mode === 'voice' && sec.children.length === 1) sec.remove();
  }
}
