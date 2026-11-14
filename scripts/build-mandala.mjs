// Build the portable atlas bundle from its editable source; no dependencies.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { drawMandala } from './draw-mandala.mjs';
import { makeMandalaRuntime } from './mandala-runtime.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = resolve(root, 'mandala');
const bundle = JSON.parse(readFileSync(resolve(root,'docs/mandala/atlas-source.json')));
writeFileSync(resolve(base,'assets/diagram.svg'), drawMandala());
const paths = [...new Set(['assets/diagram.svg', bundle.scene.image.path, ...Object.values(bundle.artworkByDeityId).flat().map(a=>a.src)])];
const artifacts = paths.map(path=>({path,bytes:statSync(resolve(base,path)).size,sha256:createHash('sha256').update(readFileSync(resolve(base,path))).digest('hex')}));
bundle.artifactManifest = {kind:'integrated-mandala-assets',repositoryCommit:bundle.catalog.commit,artifacts};
writeFileSync(resolve(base,'data/mandala-data.js'),'window.MANDALA_DATA = '+JSON.stringify(makeMandalaRuntime(bundle))+';\n');
writeFileSync(resolve(base,'data/artifact-manifest.json'),JSON.stringify(bundle.artifactManifest,null,2)+'\n');
console.log('Built mandala bundle; '+artifacts.length+' local assets.');
