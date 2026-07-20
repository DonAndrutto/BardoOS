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
