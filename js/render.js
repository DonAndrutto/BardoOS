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

const RUN_LABELS = { L1: 'READ ALOUD', L2: 'BARDO RECITATION', L3: 'LITURGY' };
const TODO = 'TODO_CONTENT';

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

// Text goes in as data, comes out as DOM text nodes — no HTML parsing of
// content, ever. Verse lines split on \n; declared gaps (TODO_CONTENT)
// are marked visibly rather than hidden.
function fillInline(node, value) {
  const lines = String(value).split('\n');
  for (const line of lines) {
    const target = lines.length > 1 ? el('span', 'line', node) : node;
    line.split(TODO).forEach((piece, j, pieces) => {
      if (piece) target.appendChild(document.createTextNode(piece));
      if (j < pieces.length - 1) el('span', 'todo', target).textContent = TODO;
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

function blockEl(block, fields) {
  const div = el('div', `block layer-${block.layer} form-${block.form}`);
  div.dataset.blockId = block.id;
  for (const f of fields) {
    fillInline(el('div', f === 'bo' ? 'bo' : f, div), block[f]);
  }
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
  if (text.title.en != null) fillInline(el('div', 'en', title), text.title.en);

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
