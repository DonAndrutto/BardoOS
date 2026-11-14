// Share the reader's saved day/night preference and design tokens.
import { state, set } from '../js/store.js';

function applyTheme(theme = state.theme) {
  const dark = theme !== 'light';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#171412' : '#FDFBF7';
  document.getElementById('theme-toggle').setAttribute('aria-pressed', String(dark));
}

applyTheme();
document.getElementById('theme-toggle').addEventListener('click', () => {
  set('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  applyTheme();
});
window.addEventListener('storage', event => {
  if (event.key !== 'bardo-os-settings') return;
  try { Object.assign(state, JSON.parse(event.newValue || '{}')); applyTheme(); } catch { /* Keep the current palette if storage is unavailable. */ }
});

// Direct atlas visits use the same offline cache as the reader.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
