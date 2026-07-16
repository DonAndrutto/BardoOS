// Data access. Content is static JSON; paths are relative so the app
// works from any base path (GitHub Pages subpath included).

async function getJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export function loadCycle() {
  return getJSON('content/cycle.json');
}

export function loadText(id) {
  return getJSON(`content/texts/${encodeURIComponent(id)}.json`);
}
