import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {drawMandala} from './draw-mandala.mjs';
import {makeMandalaRuntime} from './mandala-runtime.mjs';
import {center, markerLayout} from './mandala-layout.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), base=resolve(root,'mandala');
const read=p=>readFileSync(resolve(base,p),'utf8');
const b=JSON.parse(readFileSync(resolve(root,'docs/mandala/atlas-source.json'),'utf8'));
const {scene,catalog}=b;
const artifactManifest=JSON.parse(read('data/artifact-manifest.json'));
const context={window:{}};
vm.createContext(context);
vm.runInContext(read('data/mandala-data.js'),context);
vm.runInContext(readFileSync(resolve(root,'docs/mandala/evidence.js'),'utf8'),context);
vm.runInContext(read('preview.js'),context);
const runtime=JSON.parse(JSON.stringify(context.window.MANDALA_DATA));
assert.deepEqual(runtime,makeMandalaRuntime(b),'Rebuild runtime after editing source');
assert(!/verified|unresolved|provisional|ambiguity|hypotheses|sourceIds|candidate/i.test(read('data/mandala-data.js')));
for (const target of runtime.scene.selectionTargets) {
 assert(target.label, `Missing label for ${target.id}`);
 assert.deepEqual(target.artworkGroups.flatMap(group => group.deityIds).sort(), [...target.deityIds].sort());
}
// Preview real catalog targets with every layer combination. Hidden deities
// must never leak into a hover card; paired artwork must appear only once.
for(const target of runtime.scene.selectionTargets) for(const layers of [
 {peaceful:true,wrathful:true},{peaceful:true,wrathful:false},
 {peaceful:false,wrathful:true},{peaceful:false,wrathful:false}
]){
 const preview=context.window.MandalaPreview.artworksFor(target,runtime,layers);
 assert(preview.items.length<=4);
 assert.equal(new Set(preview.items.map(item=>item.src)).size,preview.items.length);
 for(const item of preview.items){
  assert(item.ids.length>0);
  assert(item.ids.every(id=>layers[id.startsWith('zhiwa.')?'peaceful':'wrathful']));
  assert(item.label && !item.label.includes('undefined'));
 }
 if(!layers.peaceful&&!layers.wrathful)assert.equal(preview.total,0);
}
const diagram=read('assets/diagram.svg');
assert.equal(diagram,drawMandala(),'Rebuild the architectural drawing');
const svgIds=[...diagram.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(svgIds).size,svgIds.length,'SVG definitions must have unique IDs');
for(const m of diagram.matchAll(/href="#([^"]+)"/g))assert(svgIds.includes(m[1]),`Missing drawing symbol ${m[1]}`);
for(const layer of ['fire-ring','vajra-fence','water-wind','charnel-grounds','outer-lotus','palace-walls','inner-lotuses'])assert(svgIds.includes(layer));
assert.deepEqual(Array.from(diagram.matchAll(/data-corner-vajra="([^"]+)"/g), match => match[1]),
 ['west', 'north', 'east', 'south']);
const lotus = diagram.slice(diagram.indexOf('id="inner-lotuses"'));
assert.deepEqual(Array.from(lotus.matchAll(/href="#vajra" transform="([^"]+)"/g), match => match[1]),
 Array.from({length: 64}, (_, i) => `rotate(${i * 5.625}) translate(0 -508) scale(.48 .52)`));
const lotusBands = [...lotus.matchAll(/data-inner-lotus-band="([^"]+)"[^]*?(?=data-inner-lotus-band=|<\/svg>)/g)];
assert.deepEqual(lotusBands.map(([markup, name]) => [
 name, Array.from(markup.matchAll(/transform="rotate\(([0-9]+)\)" data-lotus-petal/g), match => Number(match[1])),
]), [
 ['outer-green', [30, 90, 150, 210, 270, 330]],
 ['orange', [0, 45, 90, 135, 180, 225, 270, 315]],
 ['inner-green', [0, 45, 90, 135, 180, 225, 270, 315]],
 ['family', [0, 90, 180, 270]],
]);
assert.deepEqual(Array.from(lotus.matchAll(/data-family-color="([^"]+)"/g), match => match[1]),
 ['green', 'blue', 'green', 'blue']);
const gateOrnaments = diagram.matchAll(/<g data-gate="([^"]+)"[^>]+>([^]*?)<\/g>/g);
assert.deepEqual([...gateOrnaments].map(([, direction, content]) => [
 direction, Array.from(content.matchAll(/data-ornament="([^"]+)"/g), match => match[1]),
]), [
 ['west', ['parasol', 'parasol']],
 ['north', ['victory-banner', 'victory-banner']],
 ['east', ['parasol', 'parasol']],
 ['south', ['victory-banner', 'victory-banner']],
]);
assert.equal([...diagram.matchAll(/data-ornament="wheel-and-deer"/g)].length,4);
assert.equal([...diagram.matchAll(/data-fire-panel="/g)].length,16);
assert.equal([...diagram.matchAll(/data-ground="/g)].length,8);
assert.equal([...diagram.matchAll(/data-ring-vajra="/g)].length,8);
assert.equal([...diagram.matchAll(/data-ring-link="/g)].length,8);
const fence = [...diagram.matchAll(/data-ring-position="([0-9.]+)">[^]*?data-ring-(vajra|link)=""/g)];
assert.deepEqual(fence.map(([, angle, kind]) => [Number(angle), kind]), Array.from({length: 16}, (_, i) =>
 [i * 22.5, i % 2 ? 'link' : 'vajra']));
assert.equal([...diagram.matchAll(/data-fire-tongue="/g)].length,160);
assert.equal([...diagram.matchAll(/data-water-gap="/g)].length,8);
assert.equal([...diagram.matchAll(/data-lotus-crown="/g)].length,32);
const observations = new Map(scene.observations.map(o => [o.id, o]));
const layout = (target, painting = false) => markerLayout(target, observations, scene.image.width, painting);
const central = Array.from(scene.selectionTargets).filter(t => t.group === 'central').flatMap(t => layout(t));
assert.deepEqual(central.map(p => p.x), Array(4).fill(center[0]));
assert.deepEqual(central.map(p => p.y - center[1]), [-69, -23, 23, 69]);
const petalCoordinates = [[0, -138], [0, -158], [0, -178], [0, -198], [-39, -168], [39, -168]];
const orientations = ['west', 'north', 'east', 'south'];
for (const target of scene.selectionTargets) {
 const circles = Array.from(layout(target));
 assert(circles.length > 0);
 assert(circles.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.radius > 0 && p.color));
 if (target.kind === 'petal-assembly') {
  assert.equal(circles.length, 6);
  const direction = orientations.indexOf(target.candidateRitualDirection);
  assert.deepEqual(circles.map(p => [p.x - center[0], p.y - center[1]]), petalCoordinates.map(([x, y]) =>
   [[x, y], [-y, x], [-x, -y], [y, -x]][direction].map(n => n || 0)));
 }
 if (!target.designLocation) {
  const observed = target.observationIds.map(id => observations.get(id))
   .filter(o => o.observationalStatus === 'observed-circle');
  assert.deepEqual(Array.from(layout(target, true), p => [p.x, p.y]), Array.from(observed, o =>
   [o.x * scene.image.width, o.y * scene.image.height]));
 }
}
assert(!/data-observation|editorial-marker|NaN|undefined/.test(diagram),'Deity marks belong to the interactive layers, not the architectural background');
assert.equal(catalog.deities.length,100);assert.equal(scene.selectionTargets.length,62);assert.equal(scene.observations.length,59);
const ids=new Set(catalog.deities.map(d=>d.id)),owners=[];
for(const t of scene.selectionTargets){
 assert.equal(t.verifiedIdentityBindings.length,0);assert(t.candidateDeityIds.every(id=>ids.has(id)));owners.push(...t.observationIds);
 if(t.designLocation){assert.equal(t.observationIds.length,0);assert.equal(t.designLocation.paintedMarkerObserved,false);assert.equal(t.placementStatus,'working-placement');}
 else assert(context.window.MandalaEvidence.buildPanel(t,b).summary);
}
assert.equal(new Set(owners).size,59);assert.equal(owners.length,59);
for(const dir of ['east','south','west','north']){const group=scene.selectionTargets.filter(t=>t.designLocation&&t.candidateRitualDirection===dir);assert.equal(group.filter(t=>t.role==='courtyard').length,6);assert.equal(group.filter(t=>t.role==='outer-gate').length,1);}
for(const id of ids){assert(scene.deityToCandidateTargets[id].length);assert(b.artworkByDeityId[id].length);}
const munis=catalog.deities.filter(d=>/^zhiwa\.(29|30|31|32|33|34)-/.test(d.id));
assert.equal(munis.length,6);
const manifest=JSON.parse(readFileSync(resolve(root,'assets/deities/MANIFEST.json')));
for(const d of munis){
 const art=b.artworkByDeityId[d.id][0];
 assert.equal(art.provenance.kind,'owner-supplied-replacement');
 assert.match(art.provenance.sourceSha256,/^[a-f0-9]{64}$/);
 const depiction=manifest.collections[0].depictions.find(p=>p.deityIds.includes(d.id));
 assert.equal(depiction.sourceFile,art.provenance.sourceFile);
 assert.equal('../'+depiction.image,art.src);
}
for(const a of artifactManifest.artifacts){const bytes=readFileSync(resolve(base,a.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
assert(!/\/Users\/|\/private\/tmp\/|docs\.google\.com/.test(read('data/mandala-data.js')));
for(const match of readFileSync(resolve(root,'sw.js'),'utf8').matchAll(/"(mandala\/[^"\n]*)"/g))assert(existsSync(resolve(root,match[1])));
console.log('PASS: 62 targets, 59 observations, 28 schematic placements, 100 identities, symmetric drawn positions, painting overlays, layer-aware artwork previews, six replacement munis, repeated gate ornaments, architectural layers, artifact hashes, portable source and offline paths.');
