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

export async function loadCycle() {
  const cycle = await getJSON('content/cycle.json');
  cycleIndex.clear();
  for (const group of cycle.groups) {
    for (const entry of group.texts) cycleIndex.set(entry.id, entry);
  }
  return cycle;
}

// Manifest entry {id, title, status} for a text id, or null.
export function cycleEntry(id) {
  return cycleIndex.get(id) || null;
}

export function loadText(id) {
  return getJSON(`content/texts/${encodeURIComponent(id)}.json`);
}
