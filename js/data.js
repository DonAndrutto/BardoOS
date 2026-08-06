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
// The deity manifest, indexed by id. This is optional data: the roster
// is the owner's to supply, and until it exists — or if the file is
// ever missing — the app must read exactly as it does now. So a failure
// here is not an error; it simply means no plate is ever rendered.
const deityIndex = new Map();

export async function loadDeities() {
  deityIndex.clear();
  try {
    const manifest = await getJSON('assets/deities/MANIFEST.json');
    for (const deity of manifest.deities || []) {
      if (deity && deity.id) deityIndex.set(deity.id, deity);
    }
  } catch {
    // No manifest, no iconography. The texts read the same.
  }
  return deityIndex.size;
}

// The manifest record for a deity id, or null.
export function deityEntry(id) {
  return deityIndex.get(id) || null;
}

// Every deity that dawns on a given day of the bardo of reality, in
// manifest order — the seam for the day-by-day lookup (BRIEF §7).
export function deitiesForDay(day) {
  return [...deityIndex.values()].filter((d) => d.day === day);
}
