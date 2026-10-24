// Data access. Content is static JSON; paths are relative so the app
// works from any base path (GitHub Pages subpath included).

async function getJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

// The manifest, indexed by text id once loaded — so the renderer can
// resolve a prayerRef to its title and status synchronously. The app
// always loads the cycle before rendering any text.
const cycleIndex = new Map();

// For each text, the next translated text in the same manifest group —
// so a text can offer a "next in line" link. Null at a group's end.
const nextInGroupIndex = new Map();

export async function loadCycle() {
  const cycle = await getJSON('content/cycle.json');
  cycleIndex.clear();
  nextInGroupIndex.clear();
  for (const group of cycle.groups) {
    for (const entry of group.texts) cycleIndex.set(entry.id, entry);
    // Chain each translated entry to the next translated one in this group
    // (forthcoming entries have no readable page, so they are skipped).
    const translated = group.texts.filter((e) => e.status === 'translated');
    for (let i = 0; i < translated.length; i++) {
      nextInGroupIndex.set(translated[i].id, translated[i + 1] || null);
    }
  }
  return cycle;
}

// Manifest entry {id, title, status} for a text id, or null.
export function cycleEntry(id) {
  return cycleIndex.get(id) || null;
}

// The next translated text in the same manifest group, or null at the end.
export function nextInGroup(id) {
  return nextInGroupIndex.get(id) || null;
}

export function loadText(id) {
  return getJSON(`content/texts/${encodeURIComponent(id)}.json`);
}

// ── Iconography (BRIEF §7) ──────────────────────────────────────────
// A *deity* is an identity; a *depiction* is a picture. They are not the
// same thing: six of the 36 pictures show a couple in union, so 42
// deities are carried by 36 depictions, and tapping either deity of a
// pair opens the one they share.
//
// This is optional data. Until a collection exists — or if the file is
// ever missing — the app must read exactly as it does without it, so a
// failure here is not an error: it simply means no name is a tap.
const deityIndex = new Map();      // deity id → record
const depictionIndex = new Map();  // deity id → the depiction showing it
const collections = [];            // in manifest order, each with its own list

// A *plate* is a picture of a whole arising — the day-by-day clusters of
// the *bardo* of *dharmatā*, one composite each. Where a deity is an
// identity carried by a picture, a plate's identity and its picture are
// the same thing: nothing to associate, no union to reconcile. A plate
// is summoned from the section heading that names its day, never from a
// word in the running text.
const plateIndex = new Map();      // plate id → record
const sets = [];                   // plate sets, in manifest order

export async function loadDeities() {
  deityIndex.clear();
  depictionIndex.clear();
  collections.length = 0;
  plateIndex.clear();
  sets.length = 0;
  try {
    const manifest = await getJSON('assets/deities/MANIFEST.json');
    for (const c of manifest.collections || []) {
      for (const d of c.deities || []) {
        if (d && d.id) deityIndex.set(d.id, { ...d, collection: c.id });
      }
      const shown = [];
      for (const x of c.depictions || []) {
        if (!x || !x.image || !Array.isArray(x.deityIds)) continue;
        const depiction = { ...x, collection: c.id };
        shown.push(depiction);
        for (const id of x.deityIds) depictionIndex.set(id, depiction);
      }
      collections.push({
        id: c.id,
        label: c.label,
        attribution: c.attribution || null,
        license: c.license || null,
        depictions: shown,
      });
    }
    for (const s of manifest.plateSets || []) {
      const held = [];
      for (const p of s.plates || []) {
        if (!p || !p.id || !p.image) continue;
        const plate = { ...p, set: s.id };
        held.push(plate);
        plateIndex.set(p.id, plate);
      }
      if (!held.length) continue;
      sets.push({
        id: s.id,
        label: s.label,
        attribution: s.attribution || null,
        license: s.license || null,
        plates: held,
      });
    }
  } catch {
    // No manifest, no iconography. The texts read the same.
  }
  return depictionIndex.size + plateIndex.size;
}

// The record for a deity id, or null.
export function deityEntry(id) {
  return deityIndex.get(id) || null;
}

// The picture that shows a given deity, or null when none does — which
// is what decides whether that name is a tap at all.
export function depictionFor(deityId) {
  return depictionIndex.get(deityId) || null;
}

// The deities a depiction shows, in the order it lists them: one name
// for a single figure, both for a couple in union.
export function depictionDeities(depiction) {
  return (depiction.deityIds || []).map((id) => deityIndex.get(id)).filter(Boolean);
}

// Every collection that has something to show, in manifest order — and
// each one's depictions in the owner's numbering, which is the order the
// gallery presents them in.
export function deityCollections() {
  return collections.filter((c) => c.depictions.length);
}

export function collectionById(id) {
  return collections.find((c) => c.id === id) || null;
}

// The plate a section's heading names, or null when the manifest holds
// none — which is what decides whether that heading is a way in at all.
export function plateFor(plateId) {
  return plateIndex.get(plateId) || null;
}

// Every plate set that has something to show, in manifest order; each
// one's plates in the owner's numbering, which is the order the gallery
// presents them in.
export function plateSets() {
  return sets;
}

export function plateSetById(id) {
  return sets.find((s) => s.id === id) || null;
}

// Either shelf under Iconography, named as the manifest names it: the
// collections of figures first, then the sets of plates.
export function iconographyShelves() {
  return [
    ...deityCollections().map((c) => ({ id: c.id, label: c.label })),
    ...sets.map((s) => ({ id: s.id, label: s.label })),
  ];
}
