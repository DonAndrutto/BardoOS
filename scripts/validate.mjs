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
const KINDS = ['instruction', 'liturgy', 'prayer', 'diagnostic', 'phowa'];
const CYCLES = ['zab-chos-zhi-khro', 'dudjom-six-bardos'];

// Tibetan closing marks: shad, nyis shad, tsheg shad ×3, gter tsheg.
const BO_TERMINATORS = ['།', '༎', '༏', '༐', '༑', '༔'];
// Ignored when checking the block's final mark: whitespace, zero-width
// space (U+200B), zero-width no-break space / stray BOM (U+FEFF).
const BO_TRAILING_IGNORE = /[\s\u200B\uFEFF]+$/u;

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

// ── The forbidden title (BRIEF §2) ──────────────────────────────────
// The pattern is assembled from fragments so the string itself exists
// nowhere in this repository, this file included. Case-insensitive,
// whitespace-tolerant. The allowlist holds the one place the brief
// quotes it in order to ban it; a future historical note would be
// added here explicitly.
const FORBIDDEN = new RegExp(
  ['tibetan', 'book', 'of', 'the', 'dead'].join('\\s+'), 'i');
const FORBIDDEN_ALLOWLIST = new Set(['BARDO_OS_BRIEF.md']);
const SCAN_SKIP_DIRS = new Set(['.git', 'node_modules']);
const SCAN_SKIP_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.pdf', '.docx']);

const errors = [];
const warnings = [];
const todoCensus = new Map(); // "file :: field-path" → count

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

// ── Deity manifest (ids only; full field spec arrives in Phase 4) ───
function loadDeityIds() {
  const file = 'assets/deities/MANIFEST.json';
  const m = readJSON(join(ROOT, file), file);
  const ids = new Set();
  if (!m) return ids;
  checkKeys(file, null, m, ['schemaVersion', 'deities']);
  if (m.schemaVersion !== 1) err(file, null, `unknown schemaVersion ${m.schemaVersion}`);
  if (!Array.isArray(m.deities)) { err(file, null, '"deities" must be an array'); return ids; }
  m.deities.forEach((d, i) => {
    if (typeof d !== 'object' || d === null || !nonEmpty(d.id)) {
      err(file, `deities[${i}]`, 'every deity needs a non-empty string "id"');
      return;
    }
    if (ids.has(d.id)) err(file, `deities[${i}]`, `duplicate deity id "${d.id}"`);
    ids.add(d.id);
  });
  return ids;
}

// ── Blocks ──────────────────────────────────────────────────────────
function checkBlock(file, sectionId, block, i, ctx) {
  const where = `${sectionId} :: block[${i}]${block && block.id ? ` (${block.id})` : ''}`;
  if (typeof block !== 'object' || block === null) { err(file, where, 'block must be an object'); return; }

  checkKeys(file, where, block,
    ['id', 'layer', 'form', 'bo', 'phon', 'en', 'meter', 'deityRef', 'day', 'note'],
    ['refrain', 'boEndsOpen']);

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

  for (const f of ['bo', 'phon', 'en', 'note']) {
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

  for (const f of ['bo', 'phon', 'en', 'note']) {
    if (isString(block[f])) countTodos(file, `${where} :: ${f}`, block[f]);
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
function checkCycle(textIds) {
  const file = 'content/cycle.json';
  const c = readJSON(join(ROOT, file), file);
  if (!c) return;
  checkKeys(file, null, c, ['schemaVersion', 'groups']);
  if (c.schemaVersion !== 1) err(file, null, `unknown schemaVersion ${c.schemaVersion}`);
  if (!Array.isArray(c.groups)) { err(file, null, '"groups" must be an array'); return; }

  const seen = new Map(); // text id → times listed
  const groupIds = new Set();
  c.groups.forEach((g, gi) => {
    const where = `groups[${gi}]${g && g.id ? ` (${g.id})` : ''}`;
    if (typeof g !== 'object' || g === null) { err(file, where, 'group must be an object'); return; }
    checkKeys(file, where, g, ['id', 'heading', 'texts']);
    if (!nonEmpty(g.id)) err(file, where, 'group id must be a non-empty string');
    else if (groupIds.has(g.id)) err(file, where, `duplicate group id "${g.id}"`);
    else groupIds.add(g.id);
    if (typeof g.heading !== 'object' || g.heading === null) err(file, where, '"heading" must be an object');
    else {
      checkKeys(file, `${where} :: heading`, g.heading, ['bo', 'en']);
      if (!nonEmpty(g.heading.en)) err(file, where, 'heading "en" must be a non-empty string');
      else countTodos(file, `${where} :: heading.en`, g.heading.en);
    }
    if (!Array.isArray(g.texts) || g.texts.length === 0) {
      err(file, where, '"texts" must be a non-empty array of text ids');
      return;
    }
    g.texts.forEach((id) => {
      if (!isString(id)) { err(file, where, 'text ids must be strings'); return; }
      seen.set(id, (seen.get(id) || 0) + 1);
      if (!textIds.has(id)) err(file, where, `dangling text id "${id}" — no valid text declares this id`);
    });
  });
  for (const [id, n] of seen) {
    if (n > 1) err(file, null, `text "${id}" listed ${n} times — every text appears exactly once`);
  }
  for (const id of textIds) {
    if (!seen.has(id)) err(file, null, `text "${id}" exists on disk but is not in the cycle manifest`);
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
const deityIds = loadDeityIds();
const textIds = new Set();

const textsDir = join(ROOT, 'content', 'texts');
const textFiles = existsSync(textsDir)
  ? readdirSync(textsDir).filter((f) => f.endsWith('.json')).sort()
  : [];
for (const f of textFiles) {
  checkText(join(textsDir, f), `content/texts/${f}`, deityIds, textIds);
}
checkCycle(textIds);
scanForbidden();

// ── Report ──────────────────────────────────────────────────────────
const out = (s) => process.stdout.write(s + '\n');

out(`Bardo OS validator — ${textFiles.length} text file(s), ${deityIds.size} deity id(s)`);

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
