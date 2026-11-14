import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {drawMandala} from './draw-mandala.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), base=resolve(root,'mandala');
const read=p=>readFileSync(resolve(base,p),'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(read('data/mandala-data.js'),context);vm.runInContext(read('evidence.js'),context);
const b=context.window.MANDALA_DATA,{scene,catalog}=b;
vm.runInContext(read('preview.js'),context);
// Preview real catalog targets with every layer combination. Hidden deities
// must never leak into a hover card; paired artwork must appear only once.
for(const target of scene.selectionTargets) for(const layers of [
 {peaceful:true,wrathful:true},{peaceful:true,wrathful:false},
 {peaceful:false,wrathful:true},{peaceful:false,wrathful:false}
]){
 const preview=context.window.MandalaPreview.artworksFor(target,b,layers);
 assert(preview.items.length<=4);
 assert.equal(new Set(preview.items.map(item=>item.src)).size,preview.items.length);
 for(const item of preview.items){
  assert(item.ids.length>0);
  assert(item.ids.every(id=>layers[id.startsWith('zhiwa.')?'peaceful':'wrathful']));
  assert(item.label && !item.label.includes('undefined'));
 }
 if(!layers.peaceful&&!layers.wrathful)assert.equal(preview.total,0);
}
const source=JSON.parse(read('data/atlas-source.json'));
const {artifactManifest,...data}=JSON.parse(JSON.stringify(b));assert.deepEqual(data,source,'Rebuild bundle after editing source');
const diagram=read('assets/diagram.svg');
assert.equal(diagram,drawMandala(),'Rebuild the architectural drawing');
const svgIds=[...diagram.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(svgIds).size,svgIds.length,'SVG definitions must have unique IDs');
for(const m of diagram.matchAll(/href="#([^"]+)"/g))assert(svgIds.includes(m[1]),`Missing drawing symbol ${m[1]}`);
for(const layer of ['fire-ring','vajra-fence','charnel-grounds','outer-lotus','palace-walls','inner-lotuses'])assert(svgIds.includes(layer));
assert.equal([...diagram.matchAll(/data-ornament="wheel-and-deer"/g)].length,4);
assert.equal([...diagram.matchAll(/data-ornament="parasol"/g)].length,4);
assert.equal([...diagram.matchAll(/data-ornament="victory-banner"/g)].length,4);
assert.equal([...diagram.matchAll(/data-fire-panel="/g)].length,16);
assert.equal([...diagram.matchAll(/data-ground="/g)].length,8);
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
console.log('PASS: 62 targets, 59 observations, 28 schematic placements, 100 identities, layer-aware artwork previews, six replacement munis, repeated gate ornaments, architectural layers, artifact hashes, portable source and offline paths.');
