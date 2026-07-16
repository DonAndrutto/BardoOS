// Rendering. The renderer reads data; it never interprets prose.
// Layer treatments per docs/layer-palette.md (approved):
//   L0 rubric — quiet, muted, centered narrow; never spoken
//   L1 address — left-aligned run with gold rule + ◆ READ ALOUD label
//   L2 bardo recitation — framed panel, verse, BARDO RECITATION label
//   L3 living liturgy — centered, LITURGY label per run
//   L4 apparatus — titles / colophons, silent

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

function blockEl(block) {
  const div = el('div', `block layer-${block.layer} form-${block.form}`);
  div.dataset.blockId = block.id;
  if (block.bo != null) fillInline(el('div', 'bo', div), block.bo);
  // Rubric is never recited: no phonetics on L0 regardless of data.
  if (block.phon != null && block.layer !== 'L0') {
    fillInline(el('div', 'phon', div), block.phon);
  }
  if (block.en != null) fillInline(el('div', 'en', div), block.en);
  return div;
}

// Consecutive blocks of a spoken layer form one labeled run:
// the label appears once per run, not once per block.
function renderBlocks(blocks, parent) {
  let i = 0;
  while (i < blocks.length) {
    const layer = blocks[i].layer;
    if (RUN_LABELS[layer]) {
      const run = el('div', `run-${layer}`, parent);
      el('span', 'run-label', run).textContent = RUN_LABELS[layer];
      while (i < blocks.length && blocks[i].layer === layer) {
        run.appendChild(blockEl(blocks[i]));
        i++;
      }
    } else {
      parent.appendChild(blockEl(blocks[i]));
      i++;
    }
  }
}

export function renderText(text, container) {
  container.textContent = '';

  const title = el('header', 'text-title', container);
  if (text.title.bo != null) fillInline(el('div', 'bo', title), text.title.bo);
  if (text.title.en != null) fillInline(el('div', 'en', title), text.title.en);

  for (const section of text.sections) {
    const sec = el('section', 'section', container);
    sec.dataset.sectionId = section.id;
    fillInline(el('h2', 'section-heading', sec), section.heading.en);
    renderBlocks(section.blocks, sec);
  }
}
