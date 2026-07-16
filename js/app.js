// Boot: theme, navigation from the cycle manifest, text rendering.
// Phase 1 proves the data flow; the reading surface (modes, auto-scroll,
// controls, resume) is Phase 2.

import { loadCycle, loadText } from './data.js';
import { renderText } from './render.js';

const TODO = 'TODO_CONTENT';

// Respect the system on first run; the manual toggle (Phase 2) will win
// over this once it exists.
function applyTheme() {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function note(container, message) {
  container.textContent = '';
  const p = document.createElement('p');
  p.className = 'block layer-L0';
  p.textContent = message;
  container.appendChild(p);
}

async function openText(id, button) {
  const reader = document.getElementById('reader');
  document.querySelectorAll('.nav button').forEach(b =>
    b.classList.toggle('active', b === button));
  try {
    renderText(await loadText(id), reader);
  } catch (err) {
    note(reader, `Could not load this text (${err.message}).`);
  }
}

async function boot() {
  applyTheme();

  const nav = document.getElementById('nav');
  const reader = document.getElementById('reader');

  let cycle;
  try {
    cycle = await loadCycle();
  } catch (err) {
    note(reader, `Could not load the cycle manifest (${err.message}).`);
    return;
  }

  if (!cycle.groups.length) {
    note(reader, 'No texts in the cycle yet.');
    return;
  }

  for (const group of cycle.groups) {
    const h = document.createElement('h2');
    h.textContent = group.heading.en;
    nav.appendChild(h);
    for (const id of group.texts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = id; // replaced by the title once the text loads below
      b.title = id;
      b.addEventListener('click', () => openText(id, b));
      nav.appendChild(b);
      // Fetch the title lazily for the nav label; the id is the honest fallback.
      loadText(id).then(t => {
        if (t.title.en && t.title.en !== TODO) b.textContent = t.title.en;
      }).catch(() => {});
    }
  }

  // Open the first text so the page is never blank.
  const first = nav.querySelector('button');
  if (first) first.click();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
