#!/usr/bin/env node
// Bardo OS content validator — the schema's teeth. See SCHEMA.md §7.
// Plain Node ≥ 18, zero packages. Run: node scripts/validate.mjs
// Exit 0: contract holds (warnings and declared TODO_CONTENT gaps allowed).
// Exit 1: contract violated; every violation is listed, not just the first.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const TODO = 'TODO_CONTENT';

const LAYERS = ['L0', 'L1', 'L2', 'L3', 'L4'];
const SPOKEN = ['L1', 'L2', 'L3'];
const FORMS = ['prose', 'verse', 'title', 'colophon'];
// 'guide' and 'app' cover the app's own Guide texts (SCHEMA.md, Phase 3
// amendments) — material of the instrument, not of either textual cycle.
const KINDS = ['instruction', 'liturgy', 'prayer', 'diagnostic', 'phowa', 'guide'];
const CYCLES = ['zab-chos-zhi-khro', 'dudjom-six-bardos', 'app'];

// Tibetan closing marks: shad, nyis shad, tsheg shad ×3, gter tsheg.
const BO_TERMINATORS = ['།', '༎', '༏', '༐', '༑', '༔'];
// Ignored when checking the block's final mark: whitespace, zero-width
// space (U+200B), zero-width no-break space / stray BOM (U+FEFF).
const BO_TRAILING_IGNORE = /[\s\u200B\uFEFF]+$/u;

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

// Inline deity token: [[the owner's words|deity-id] ] (SCHEMA.md §4,
// Phase 4 amendment). Words first, so the sentence still reads in the
// file. The marker is added around text that is already there; the words
// between the brackets are never edited.
const DEITY_TOKEN = /\[\[([^[\]|]+)\|([^[\]|]+)\]\]/g;

// ── The forbidden title (BRIEF §2) ──────────────────────────────────
// The pattern is assembled from fragments so the string itself exists
// nowhere in this repository, this file included. Case-insensitive,
// whitespace-tolerant. The allowlist holds the one place the brief
// quotes it in order to ban it, plus the one permitted historical note
// (BRIEF §2): the Guide's Introduction, which names the invented title
// in order to reject it (owner-directed, 2026-07-19).
const FORBIDDEN = new RegExp(
  ['tibetan', 'book', 'of', 'the', 'dead'].join('\\s+'), 'i');
const FORBIDDEN_ALLOWLIST = new Set([
  'BARDO_OS_BRIEF.md',
  'content/texts/guide.introduction.json',
  'content/texts/guide.how-to-use.json',
]);
const SCAN_SKIP_DIRS = new Set(['.git', 'node_modules']);
const SCAN_SKIP_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.pdf', '.docx']);

const errors = [];
const warnings = [];
const todoCensus = new Map(); // "file :: field-path" → count
// prayerRefs are collected during text checks and resolved after the
// cycle manifest is read — a ref may legally point at a forthcoming
// text, which exists only there.
const prayerRefs = []; // { file, where, ref }

function err(file, where, message) {
  errors.push(`${file}${where ? ` :: ${where}` : ''} :: ${message}`);
}
function warn(file, where, message) {
  warnings.push(`${file}${where ? ` :: ${where}` : ''} :: ${message}`);
}
function countTodos(file, where, value) {
  const n = value.split(TODO).length - 1;
  if (n > 0) todoCensus.set(`${file} :: ${where}`, n);
}

function isString(v) { return typeof v === 'string'; }
function nonEmpty(v) { return isString(v) && v.trim() !== ''; }
function isNullableString(v) { return v === null || isString(v); }

function checkKeys(file, where, obj, required, optional = []) {
  for (const k of required) {
    if (!(k in obj)) err(file, where, `missing required field "${k}"`);
  }
  for (const k of Object.keys(obj)) {
    if (!required.includes(k) && !optional.includes(k)) {
      err(file, where, `unknown field "${k}"`);
    }
  }
}

function readJSON(path, file) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e) {
    err(file, null, `unreadable: ${e.message}`);
    return null;
  }
  if (raw.charCodeAt(0) === 0xFEFF) {
    err(file, null, 'file starts with a UTF-8 BOM; save without one');
    raw = raw.slice(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    err(file, null, `invalid JSON: ${e.message}`);
    return null;
  }
}

// ── Deity manifest (SCHEMA.md §9) ───────────────────────────────────
// The iconography contract, in the owner's own terms: a *deity* is an
// identity, a *depiction* is a picture, and the two are not the same
// thing — six of these pictures show a couple in union, so 36 depictions
// carry 42 deities. Tapping either deity of a pair opens the shared
// depiction, which falls straight out of the model.
//
// Only what the feature needs is required: number, id, label, and the
// deity→depiction association. Everything else a record may one day
// carry (bo, family, direction, colour, seed, day…) is genuinely
// optional — absent is normal, never a warning, and never filled with a
// placeholder. Day assignments in particular are not part of this model:
// the day-by-day clusters are a separate future presentation with its
// own composite images (owner's direction, 2026-08-06).
const COLLECTION_FIELDS = ['id', 'label', 'attribution', 'license', 'deities', 'depictions'];
const DEITY_REQUIRED = ['number', 'id', 'label'];
// Reserved for future metadata. Legal, never required, never reported.
const DEITY_OPTIONAL = [
  'textAliases', 'bo', 'phon', 'sa', 'family', 'direction', 'color', 'seed', 'day',
];
const DEPICTION_FIELDS = ['id', 'sourceFile', 'image', 'deityIds'];
const DEITY_IMAGE_DIR = 'assets/deities/images/';
const DEITY_IMAGE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg']);

function checkDeity(file, where, d, ctx) {
  if (typeof d !== 'object' || d === null) { err(file, where, 'deity must be an object'); return; }
  checkKeys(file, where, d, DEITY_REQUIRED, DEITY_OPTIONAL);

  if (!Number.isInteger(d.number) || d.number < 1) {
    err(file, where, `"number" must be a positive integer (got ${JSON.stringify(d.number)})`);
  } else if (ctx.numbers.has(d.number)) {
    err(file, where, `duplicate deity number ${d.number} in this collection`);
  } else ctx.numbers.add(d.number);

  if (!nonEmpty(d.label)) err(file, where, '"label" must be a non-empty string');
  else countTodos(file, `${where} :: label`, d.label);

  if ('textAliases' in d) {
    // Documentation of an established name relationship — never matching
    // input. A name becomes a tap only where the owner marked it.
    if (!Array.isArray(d.textAliases) || d.textAliases.length === 0) {
      err(file, where, '"textAliases" must be a non-empty array of strings, or omitted');
    } else if (d.textAliases.some((a) => !nonEmpty(a))) {
      err(file, where, '"textAliases" entries must be non-empty strings');
    }
  }

  if (!nonEmpty(d.id)) { err(file, where, 'deity "id" must be a non-empty string'); return; }
  if (!ID_PATTERN.test(d.id)) err(file, where, `deity id "${d.id}" is not kebab-case`);
  if (ctx.deityIds.has(d.id)) err(file, where, `duplicate deity id "${d.id}"`);
  else ctx.deityIds.add(d.id);
}

function checkDepiction(file, where, x, ctx) {
  if (typeof x !== 'object' || x === null) { err(file, where, 'depiction must be an object'); return; }
  checkKeys(file, where, x, DEPICTION_FIELDS);

  if (!nonEmpty(x.id)) err(file, where, 'depiction "id" must be a non-empty string');
  else if (!ID_PATTERN.test(x.id)) err(file, where, `depiction id "${x.id}" is not kebab-case`);
  else if (ctx.depictionIds.has(x.id)) err(file, where, `duplicate depiction id "${x.id}"`);
  else ctx.depictionIds.add(x.id);

  if (!nonEmpty(x.sourceFile)) err(file, where, '"sourceFile" must name the master it came from');

  // The picture itself: a real file in the repo, in a format the app can
  // show. Provenance is collection-level, so nothing is asked of it here.
  if (!nonEmpty(x.image)) {
    err(file, where, '"image" must be a path under ' + DEITY_IMAGE_DIR);
  } else if (!x.image.startsWith(DEITY_IMAGE_DIR)) {
    err(file, where, `"image" must live under ${DEITY_IMAGE_DIR} (got "${x.image}")`);
  } else if (!DEITY_IMAGE_EXTS.has(extname(x.image).toLowerCase())) {
    err(file, where, `"image" must be one of ${[...DEITY_IMAGE_EXTS].join(', ')} (got "${x.image}")`);
  } else if (!existsSync(join(ROOT, x.image))) {
    err(file, where, `"image" file not found: ${x.image}`);
  }

  if (!Array.isArray(x.deityIds) || x.deityIds.length === 0) {
    err(file, where, '"deityIds" must be a non-empty array — a depiction shows at least one deity');
    return;
  }
  const here = new Set();
  for (const ref of x.deityIds) {
    if (!nonEmpty(ref)) { err(file, where, '"deityIds" entries must be non-empty strings'); continue; }
    if (here.has(ref)) { err(file, where, `"deityIds" names "${ref}" twice`); continue; }
    here.add(ref);
    // Resolved after the whole collection is read: order must not matter.
    ctx.claims.push({ where, ref });
  }
}

function checkCollection(file, i, c, ctx) {
  const where = `collections[${i}]${c && c.id ? ` (${c.id})` : ''}`;
  if (typeof c !== 'object' || c === null) { err(file, where, 'collection must be an object'); return; }
  checkKeys(file, where, c, COLLECTION_FIELDS);

  if (!nonEmpty(c.id)) err(file, where, 'collection "id" must be a non-empty string');
  else if (!ID_PATTERN.test(c.id)) err(file, where, `collection id "${c.id}" is not kebab-case`);
  else if (ctx.collectionIds.has(c.id)) err(file, where, `duplicate collection id "${c.id}"`);
  else ctx.collectionIds.add(c.id);
  if (!nonEmpty(c.label)) err(file, where, 'collection "label" must be a non-empty string');

  // Attribution and licence cover the whole collection, because all its
  // pictures share one provenance. Both may be null while the owner
  // settles the wording — that is a declared gap, not a failure.
  for (const f of ['attribution', 'license']) {
    if (!isNullableString(c[f])) err(file, where, `"${f}" must be a string or null`);
    else if (isString(c[f])) countTodos(file, `${where} :: ${f}`, c[f]);
  }

  const local = { numbers: new Set(), depictionIds: new Set(), deityIds: ctx.deityIds, claims: [] };
  if (!Array.isArray(c.deities)) err(file, where, '"deities" must be an array');
  else c.deities.forEach((d, n) => {
    const w = `${where} :: deities[${n}]${d && d.id ? ` (${d.id})` : ''}`;
    checkDeity(file, w, d, local);
    if (d && d.id) ctx.deities.set(d.id, d);
  });

  if (!Array.isArray(c.depictions)) err(file, where, '"depictions" must be an array');
  else c.depictions.forEach((x, n) => {
    checkDepiction(file, `${where} :: depictions[${n}]${x && x.id ? ` (${x.id})` : ''}`, x, local);
  });

  // A depiction may show several deities; a deity is shown by at most
  // one depiction, or a tap would have two answers.
  const shownBy = new Map();
  for (const { where: w, ref } of local.claims) {
    if (!local.deityIds.has(ref)) {
      err(file, w, `"deityIds" names "${ref}", which is not a deity in this manifest`);
    } else if (shownBy.has(ref)) {
      err(file, w, `"${ref}" is already shown by ${shownBy.get(ref)}`);
    } else {
      shownBy.set(ref, w);
      ctx.depicted.add(ref);
    }
  }
  ctx.summary.push(`${c.id}: ${Array.isArray(c.deities) ? c.deities.length : 0} deities, ` +
    `${Array.isArray(c.depictions) ? c.depictions.length : 0} depictions`);
}

function loadDeities() {
  const file = 'assets/deities/MANIFEST.json';
  const ctx = {
    deities: new Map(), deityIds: new Set(), depicted: new Set(),
    collectionIds: new Set(), summary: [],
  };
  const m = readJSON(join(ROOT, file), file);
  if (!m) return ctx;
  checkKeys(file, null, m, ['schemaVersion', 'collections']);
  if (m.schemaVersion !== 1) err(file, null, `unknown schemaVersion ${m.schemaVersion}`);
  if (!Array.isArray(m.collections)) { err(file, null, '"collections" must be an array'); return ctx; }
  m.collections.forEach((c, i) => checkCollection(file, i, c, ctx));
  return ctx;
}

// ── Blocks ──────────────────────────────────────────────────────────
function checkBlock(file, sectionId, block, i, ctx) {
  const where = `${sectionId} :: block[${i}]${block && block.id ? ` (${block.id})` : ''}`;
  if (typeof block !== 'object' || block === null) { err(file, where, 'block must be an object'); return; }

  checkKeys(file, where, block,
    ['id', 'layer', 'form', 'bo', 'phon', 'en', 'meter', 'deityRef', 'day', 'note'],
    ['refrain', 'boEndsOpen', 'prayerRef', 'pl']);

  if (!nonEmpty(block.id)) err(file, where, 'block id must be a non-empty string');
  else if (!ID_PATTERN.test(block.id)) err(file, where, `block id "${block.id}" is not kebab-case`);
  else if (ctx.blockIds.has(block.id)) err(file, where, `duplicate block id "${block.id}" in this text`);
  else ctx.blockIds.add(block.id);

  if (!LAYERS.includes(block.layer)) {
    // checkKeys already reported a wholly missing field
    if (block.layer !== undefined) err(file, where, `unknown layer "${block.layer}"`);
    return; // layer-dependent checks below would only cascade noise
  }
  if (!FORMS.includes(block.form)) {
    err(file, where, block.form === undefined ? 'missing "form"' : `unknown form "${block.form}"`);
  } else if ((block.form === 'title' || block.form === 'colophon') && block.layer !== 'L4') {
    err(file, where, `form "${block.form}" is legal only on L4 (apparatus)`);
  }

  for (const f of ['bo', 'phon', 'en', 'note', 'pl']) {
    if (f in block && !isNullableString(block[f])) err(file, where, `"${f}" must be a string or null`);
  }

  // Spoken layers must never render empty (TODO_CONTENT is a declared gap).
  if (SPOKEN.includes(block.layer) && !nonEmpty(block.en)) {
    err(file, where, `empty "en" on spoken layer ${block.layer}`);
  }
  // Phonetics belong to the liturgical layer (approved decision).
  if (block.layer === 'L3' && !nonEmpty(block.phon)) {
    err(file, where, 'empty "phon" on L3 — liturgy requires phonetics');
  }
  if (block.layer === 'L0' && nonEmpty(block.phon)) {
    warn(file, where, 'phonetics on L0 — rubric is never recited; the renderer will not show them');
  }

  if (block.meter !== null && block.meter !== undefined) {
    if (!Number.isInteger(block.meter) || block.meter < 1) {
      err(file, where, '"meter" must be a positive integer or null');
    } else if (block.form !== 'verse') {
      err(file, where, '"meter" is only legal on verse');
    }
  }

  if (block.deityRef !== null && block.deityRef !== undefined) {
    if (!nonEmpty(block.deityRef)) err(file, where, '"deityRef" must be a non-empty string or null');
    else if (!ctx.deityIds.has(block.deityRef)) {
      err(file, where, `orphaned deityRef "${block.deityRef}" — not in assets/deities/MANIFEST.json`);
    }
  }

  // One prayer, or several: a single rubric sentence can name four of
  // them ("recite the Aspiration…; then the Root Verses…"), so a list
  // is legal here (SCHEMA.md, Phase 4 amendment).
  if (block.prayerRef !== null && block.prayerRef !== undefined) {
    const list = Array.isArray(block.prayerRef);
    if (list && block.prayerRef.length === 0) {
      err(file, where, '"prayerRef" must not be an empty array — write null instead');
    }
    const seenHere = new Set();
    for (const ref of list ? block.prayerRef : [block.prayerRef]) {
      if (!nonEmpty(ref)) {
        err(file, where, '"prayerRef" must be a non-empty string, an array of them, or null');
      } else if (seenHere.has(ref)) {
        err(file, where, `"prayerRef" names "${ref}" twice`);
      } else {
        seenHere.add(ref);
        prayerRefs.push({ file, where, ref });
      }
    }
  }

  if (block.day !== null && block.day !== undefined) {
    if (!Number.isInteger(block.day) || block.day < 1 || block.day > 14) {
      err(file, where, `"day" must be an integer 1–14 or null (got ${JSON.stringify(block.day)})`);
    }
  }

  for (const f of ['refrain', 'boEndsOpen']) {
    if (f in block && typeof block[f] !== 'boolean') err(file, where, `"${f}" must be a boolean`);
  }
  if (block.boEndsOpen && !nonEmpty(block.bo)) {
    err(file, where, '"boEndsOpen" is only legal on a block with Tibetan text');
  }

  // Shad integrity (SCHEMA.md §7.8). Never flags a block with no Tibetan.
  if (nonEmpty(block.bo) && !block.bo.includes(TODO) && !block.boEndsOpen) {
    const trimmed = block.bo.replace(BO_TRAILING_IGNORE, '');
    const last = trimmed.slice(-1);
    if (!BO_TERMINATORS.includes(last)) {
      err(file, where,
        `Tibetan does not end with a closing mark (ends "…${trimmed.slice(-8)}"); ` +
        'add the mark, or set "boEndsOpen": true if this verse legitimately ends open');
    }
  }
  if (nonEmpty(block.bo) && block.bo !== block.bo.normalize('NFC')) {
    warn(file, where, 'Tibetan is not NFC-normalized');
  }

  for (const f of ['bo', 'phon', 'en', 'note', 'pl']) {
    if (isString(block[f])) countTodos(file, `${where} :: ${f}`, block[f]);
  }
  for (const f of ['bo', 'phon', 'en', 'pl']) {
    if (isString(block[f])) checkDeityTokens(file, `${where} :: ${f}`, block[f], ctx);
  }
}

// Every inline deity token must be well formed and must name a deity the
// manifest actually holds — a tap that goes nowhere is worse than no tap.
function checkDeityTokens(file, where, value, ctx) {
  let found = 0;
  for (const [, words, ref] of value.matchAll(DEITY_TOKEN)) {
    found++;
    if (!words.trim()) err(file, where, 'deity token has no words to show');
    if (!ctx.deityIds.has(ref)) {
      err(file, where, `orphaned deity token "${ref}" — not in assets/deities/MANIFEST.json`);
    }
  }
  // A stray bracket means a marker was mistyped; it would render as prose.
  const opens = value.split('[[').length - 1;
  const closes = value.split(']]').length - 1;
  if (opens !== found || closes !== found) {
    err(file, where, `malformed deity token(s): ${opens} "[[", ${closes} "]]", ` +
      `${found} well-formed — the shape is [[words|deity-id]]`);
  }
}

// ── Text files ──────────────────────────────────────────────────────
function checkText(path, file, deityIds, textIds) {
  const t = readJSON(path, file);
  if (!t) return;

  checkKeys(file, null, t, ['schemaVersion', 'id', 'cycle', 'kind', 'title', 'source', 'sections']);
  if (t.schemaVersion !== 1) err(file, null, `unknown schemaVersion ${t.schemaVersion}`);

  if (!nonEmpty(t.id)) err(file, null, 'text "id" must be a non-empty string');
  else {
    if (!ID_PATTERN.test(t.id)) err(file, null, `text id "${t.id}" is not kebab-case`);
    if (t.id !== basename(file, '.json')) err(file, null, `text id "${t.id}" must equal the filename`);
    if (textIds.has(t.id)) err(file, null, `duplicate text id "${t.id}"`);
    textIds.add(t.id);
  }

  if (!CYCLES.includes(t.cycle)) err(file, null, `unknown cycle "${t.cycle}" (known: ${CYCLES.join(', ')})`);
  if (!KINDS.includes(t.kind)) err(file, null, `unknown kind "${t.kind}" (known: ${KINDS.join(', ')})`);

  if (typeof t.title !== 'object' || t.title === null) err(file, null, '"title" must be an object');
  else {
    checkKeys(file, 'title', t.title, ['bo', 'phon', 'en']);
    if (!nonEmpty(t.title.en)) err(file, 'title', '"en" must be a non-empty string');
    else countTodos(file, 'title.en', t.title.en);
    for (const f of ['bo', 'phon']) {
      if (!isNullableString(t.title[f])) err(file, 'title', `"${f}" must be a string or null`);
      else if (isString(t.title[f])) countTodos(file, `title.${f}`, t.title[f]);
    }
  }

  if (typeof t.source !== 'object' || t.source === null) err(file, null, '"source" must be an object');
  else {
    checkKeys(file, 'source', t.source, ['attribution', 'notes']);
    if (!nonEmpty(t.source.attribution)) err(file, 'source', '"attribution" must be a non-empty string');
    else countTodos(file, 'source.attribution', t.source.attribution);
    if (!isNullableString(t.source.notes)) err(file, 'source', '"notes" must be a string or null');
    else if (isString(t.source.notes)) countTodos(file, 'source.notes', t.source.notes);
  }

  if (!Array.isArray(t.sections) || t.sections.length === 0) {
    err(file, null, '"sections" must be a non-empty array');
    return;
  }
  const ctx = { deityIds, blockIds: new Set() };
  const sectionIds = new Set();
  t.sections.forEach((s, si) => {
    const where = `section[${si}]${s && s.id ? ` (${s.id})` : ''}`;
    if (typeof s !== 'object' || s === null) { err(file, where, 'section must be an object'); return; }
    checkKeys(file, where, s, ['id', 'heading', 'blocks']);
    if (!nonEmpty(s.id)) err(file, where, 'section id must be a non-empty string');
    else if (!ID_PATTERN.test(s.id)) err(file, where, `section id "${s.id}" is not kebab-case`);
    else if (sectionIds.has(s.id)) err(file, where, `duplicate section id "${s.id}"`);
    else sectionIds.add(s.id);

    if (typeof s.heading !== 'object' || s.heading === null) err(file, where, '"heading" must be an object');
    else {
      checkKeys(file, `${where} :: heading`, s.heading, ['bo', 'en']);
      if (!nonEmpty(s.heading.en)) err(file, where, 'heading "en" must be a non-empty string');
      else countTodos(file, `${where} :: heading.en`, s.heading.en);
      if (!isNullableString(s.heading.bo)) err(file, where, 'heading "bo" must be a string or null');
      else if (isString(s.heading.bo)) countTodos(file, `${where} :: heading.bo`, s.heading.bo);
    }

    if (!Array.isArray(s.blocks) || s.blocks.length === 0) {
      err(file, where, '"blocks" must be a non-empty array');
      return;
    }
    s.blocks.forEach((b, bi) => checkBlock(file, s.id || `section[${si}]`, b, bi, ctx));
  });
}

// ── Cycle manifest ──────────────────────────────────────────────────
// Text entries are objects {id, title, status}; status is enforced
// against the disk both ways so navigation can never lie about what
// is readable (SCHEMA.md §2, revised at the owner's Phase 3 direction).
const STATUSES = ['translated', 'forthcoming'];

function checkCycle(textIds) {
  const file = 'content/cycle.json';
  const manifest = new Map(); // text id → group id (for prayerRef resolution)
  const c = readJSON(join(ROOT, file), file);
  if (!c) return manifest;
  checkKeys(file, null, c, ['schemaVersion', 'groups']);
  if (c.schemaVersion !== 1) err(file, null, `unknown schemaVersion ${c.schemaVersion}`);
  if (!Array.isArray(c.groups)) { err(file, null, '"groups" must be an array'); return manifest; }

  const seen = new Map(); // text id → times listed
  const groupIds = new Set();
  c.groups.forEach((g, gi) => {
    const where = `groups[${gi}]${g && g.id ? ` (${g.id})` : ''}`;
    if (typeof g !== 'object' || g === null) { err(file, where, 'group must be an object'); return; }
    checkKeys(file, where, g, ['id', 'heading', 'texts']);
    if (!nonEmpty(g.id)) err(file, where, 'group id must be a non-empty string');
    else if (!ID_PATTERN.test(g.id)) err(file, where, `group id "${g.id}" is not kebab-case`);
    else if (groupIds.has(g.id)) err(file, where, `duplicate group id "${g.id}"`);
    else groupIds.add(g.id);
    if (typeof g.heading !== 'object' || g.heading === null) err(file, where, '"heading" must be an object');
    else {
      checkKeys(file, `${where} :: heading`, g.heading, ['bo', 'en']);
      if (!nonEmpty(g.heading.en)) err(file, where, 'heading "en" must be a non-empty string');
      else countTodos(file, `${where} :: heading.en`, g.heading.en);
    }
    // A category may be empty while it awaits its catalogue.
    if (!Array.isArray(g.texts)) {
      err(file, where, '"texts" must be an array of text entries');
      return;
    }
    g.texts.forEach((t, ti) => {
      const tw = `${where} :: texts[${ti}]${t && t.id ? ` (${t.id})` : ''}`;
      if (typeof t !== 'object' || t === null) { err(file, tw, 'text entry must be an object {id, title, status}'); return; }
      checkKeys(file, tw, t, ['id', 'title', 'status']);
      if (!nonEmpty(t.id)) { err(file, tw, 'text "id" must be a non-empty string'); return; }
      if (!ID_PATTERN.test(t.id)) err(file, tw, `text id "${t.id}" is not kebab-case`);
      if (!nonEmpty(t.title)) err(file, tw, '"title" must be a non-empty string (TODO_CONTENT for a declared gap)');
      else countTodos(file, `${tw} :: title`, t.title);
      if (!STATUSES.includes(t.status)) {
        err(file, tw, `unknown status "${t.status}" (known: ${STATUSES.join(', ')})`);
      } else if (t.status === 'translated' && !textIds.has(t.id)) {
        err(file, tw, `status "translated" but no valid content/texts/${t.id}.json exists`);
      } else if (t.status === 'forthcoming' && textIds.has(t.id)) {
        err(file, tw, `status "forthcoming" but content/texts/${t.id}.json exists — mark it "translated"`);
      }
      seen.set(t.id, (seen.get(t.id) || 0) + 1);
      manifest.set(t.id, g.id);
    });
  });
  for (const [id, n] of seen) {
    if (n > 1) err(file, null, `text "${id}" listed ${n} times — every text appears exactly once`);
  }
  for (const id of textIds) {
    if (!seen.has(id)) err(file, null, `text "${id}" exists on disk but is not in the cycle manifest`);
  }
  return manifest;
}

// ── prayerRef resolution (after the manifest is read) ───────────────
// A cross-link must point at a text the cycle lists — translated or
// forthcoming. Pointing outside the Prayers & Liturgies shelf is legal
// but usually a slip, so it warns.
const PRAYERS_GROUP = 'prayers-liturgies';

function checkPrayerRefs(manifest) {
  for (const { file, where, ref } of prayerRefs) {
    if (!manifest.has(ref)) {
      err(file, where, `orphaned prayerRef "${ref}" — not in content/cycle.json`);
    } else if (manifest.get(ref) !== PRAYERS_GROUP) {
      warn(file, where, `prayerRef "${ref}" points outside the ${PRAYERS_GROUP} shelf`);
    }
  }
}

// ── Repo-wide forbidden-title scan ──────────────────────────────────
function scanForbidden(dir = ROOT) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const rel = relative(ROOT, path);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (!SCAN_SKIP_DIRS.has(name)) scanForbidden(path);
      continue;
    }
    if (SCAN_SKIP_EXTS.has(extname(name).toLowerCase())) continue;
    if (FORBIDDEN_ALLOWLIST.has(rel)) continue;
    let raw;
    try { raw = readFileSync(path, 'utf8'); } catch { continue; }
    if (FORBIDDEN.test(raw)) {
      err(rel, null, 'contains the forbidden title (BRIEF §2). The work is the Bardo Thödröl.');
    }
  }
}

// ── Run ─────────────────────────────────────────────────────────────
const iconography = loadDeities();
// Only a deity that actually has a picture can be tapped, so that is the
// set an inline token must resolve against.
const deityIds = iconography.depicted;
const textIds = new Set();

const textsDir = join(ROOT, 'content', 'texts');
const textFiles = existsSync(textsDir)
  ? readdirSync(textsDir).filter((f) => f.endsWith('.json')).sort()
  : [];
for (const f of textFiles) {
  checkText(join(textsDir, f), `content/texts/${f}`, deityIds, textIds);
}
checkPrayerRefs(checkCycle(textIds));
scanForbidden();

// ── Report ──────────────────────────────────────────────────────────
const out = (s) => process.stdout.write(s + '\n');

out(`Bardo OS validator — ${textFiles.length} text file(s), ` +
    `${iconography.deities.size} deity record(s)`);

// Iconography, visible on every run and never a failure: what is here is
// what a reader can tap. An incomplete roster is normal.
for (const line of iconography.summary) out(`  · ${line}`);

if (warnings.length) {
  out(`\n${warnings.length} warning(s):`);
  for (const w of warnings) out(`  ~ ${w}`);
}

const totalTodos = [...todoCensus.values()].reduce((a, b) => a + b, 0);
if (totalTodos) {
  out(`\nDeclared content gaps: ${totalTodos} × ${TODO} in ${todoCensus.size} field(s) (allowed; a human fills these):`);
  const byFile = new Map();
  for (const [key, n] of todoCensus) {
    const file = key.split(' :: ')[0];
    byFile.set(file, (byFile.get(file) || 0) + n);
  }
  for (const [file, n] of byFile) out(`  · ${file}: ${n}`);
}

if (errors.length) {
  out(`\n${errors.length} error(s):`);
  for (const e of errors) out(`  ✗ ${e}`);
  out('\nFAIL — the contract is violated. Nothing above is a style choice; fix and re-run.');
  process.exit(1);
}
out('\nOK — the contract holds.');
