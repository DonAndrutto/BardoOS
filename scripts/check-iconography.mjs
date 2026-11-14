import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const { firstFigureMention, textForFigure, figureTextHref } = await import(
  `data:text/javascript;base64,${Buffer.from(read('js/iconography.js')).toString('base64')}`
);
const manifest = JSON.parse(read('assets/deities/MANIFEST.json'));
const atlas = JSON.parse(read('mandala/data/atlas-source.json'));
let figures = 0;
for (const collection of manifest.collections) {
  for (const deity of collection.deities) {
    const text = JSON.parse(read(`content/texts/${textForFigure(deity.id)}.json`));
    const blocks = text.sections.flatMap(section => section.blocks);
    const mentions = blocks.filter(block => JSON.stringify([block.en, block.bo, block.phon]).includes(`|${deity.id}]]`));
    assert(mentions.length, `${deity.id} must have a canonical mention`);
    assert.equal(firstFigureMention(text, deity.id), mentions[0].id);
    assert.equal(new URLSearchParams(figureTextHref(deity.id).slice(1)).get('deity'), deity.id);
    const locations = atlas.scene.deityToCandidateTargets[deity.id];
    assert(locations.length);
    for (const location of locations) {
      assert(atlas.scene.selectionTargets.some(target => target.id === location.targetId && target.candidateDeityIds.includes(deity.id)));
    }
    figures++;
  }
}
let plates = 0;
for (const set of manifest.plateSets) for (const plate of set.plates) {
  const text = JSON.parse(read(`content/texts/${textForFigure(plate.id)}.json`));
  const section = text.sections.find(section => section.plateRef === plate.id);
  assert(section);
  assert.equal(firstFigureMention(text, plate.id), section.blocks[0].id);
  assert.equal(new URLSearchParams(figureTextHref(plate.id).slice(1)).get('plate'), plate.id);
  plates++;
}
// Repeated names and paired depictions must resolve by identity, not spelling.
const sample = { sections: [{ blocks: [
  { id: 'first', en: '[[Same name|one]]' },
  { id: 'second', en: ['[[Same name|two]]', '[[Again|one]]'] },
] }] };
assert.equal(firstFigureMention(sample, 'one'), 'first');
assert.equal(firstFigureMention(sample, 'two'), 'second');
assert.equal(firstFigureMention(sample, 'missing'), null);
assert.equal(figures, 100); assert.equal(plates, 7);
console.log('PASS: first canonical mentions and valid mandala targets for 100 deities; day passages for all 7 plates; identity-safe paired/repeated names.');
