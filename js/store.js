// Settings store — one persisted object, written on every change,
// wrapped in try/catch so private mode can never break reading
// (a discipline inherited from the reference app).

const KEY = 'bardo-os-settings';

// Approved bounds (docs/layer-palette.md §6): min 16 / default 19 / max 48.
export const FONT_MIN = 16;
export const FONT_DEFAULT = 19;
export const FONT_MAX = 48;
export const FONT_STEP = 2;
// Voice mode reads larger: +3px over the Guide size, never below 20.
export const VOICE_BUMP = 3;
export const VOICE_FLOOR = 20;

function defaults() {
  return {
    fontSize: FONT_DEFAULT,
    theme: null,          // null = never chosen → night (the default); 'light' | 'dark' = manual choice wins
    showBo: true,
    showPhon: true,
    showEn: true,
    scrollSpeed: 2,
    mode: 'guide',        // 'guide' | 'voice'
    uiLang: 'en',         // interface language: 'bo' | 'en' | 'pl' (master selector)
  };
}

export const state = load();

function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const parsed = JSON.parse(raw);
    const merged = { ...d, ...parsed };
    // Sanitize anything a stale or hand-edited store might hold.
    merged.fontSize = clampFont(merged.fontSize);
    merged.scrollSpeed = Math.max(1, Math.min(10, Number(merged.scrollSpeed) || d.scrollSpeed));
    if (!['guide', 'voice'].includes(merged.mode)) merged.mode = 'guide';
    if (![null, 'light', 'dark'].includes(merged.theme)) merged.theme = null;
    if (!['bo', 'en', 'pl'].includes(merged.uiLang)) merged.uiLang = 'en';
    for (const k of ['showBo', 'showPhon', 'showEn']) merged[k] = Boolean(merged[k]);
    return merged;
  } catch {
    return d;
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

export function set(key, value) {
  state[key] = value;
  save();
}

export function clampFont(px) {
  const n = Number(px);
  if (!Number.isFinite(n)) return FONT_DEFAULT;
  // Clamp and keep whole pixels; no grid-snapping — the default is 19,
  // so ±2 steps walk 17/19/21…, and snapping to even values would make
  // the first tap jump 3px instead of 2.
  return Math.max(FONT_MIN, Math.min(FONT_MAX, Math.round(n)));
}

// The size the reading surface actually uses in the current mode.
export function effectiveFontSize() {
  return state.mode === 'voice'
    ? Math.max(VOICE_FLOOR, state.fontSize + VOICE_BUMP)
    : state.fontSize;
}
