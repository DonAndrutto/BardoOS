import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), base=resolve(root,'mandala');
const read=p=>readFileSync(resolve(base,p),'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(read('data/mandala-data.js'),context);vm.runInContext(read('evidence.js'),context);
const b=context.window.MANDALA_DATA,{scene,catalog}=b;
const source=JSON.parse(read('data/atlas-source.json'));
const {artifactManifest,...data}=JSON.parse(JSON.stringify(b));assert.deepEqual(data,source,'Rebuild bundle after editing source');
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
for(const a of artifactManifest.artifacts){const bytes=readFileSync(resolve(base,a.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
assert(!/\/Users\/|\/private\/tmp\/|docs\.google\.com/.test(read('data/mandala-data.js')));
for(const match of readFileSync(resolve(root,'sw.js'),'utf8').matchAll(/"(mandala\/[^"\n]*)"/g))assert(existsSync(resolve(root,match[1])));
console.log('PASS: 62 targets, 59 observations, 28 schematic placements, 100 identities, artifact hashes, portable source and offline paths.');
