// Interface language — the master selector's domain (owner's Phase 3
// direction; selector pattern from the Yontendzo reference). It governs
// the instrument's own strings: menus, labels, navigation notes. The
// TIB/PHO/ENG toggles are a different axis entirely — which layers of
// the *content* are visible — and are untouched by this.
//
// English is the only interface language with strings today. Tibetan
// and Polish are placeholders establishing the infrastructure: choosing
// one records the choice, and every lookup falls back to English,
// string by string, until the owner supplies that language's table
// (the Yontendzo behaviour). No string here is scripture — these are
// the instrument's labels, and the owner's translations land here when
// they exist.

import { state } from './store.js';

export const UI_LANGS = [
  { code: 'bo', label: 'BOD', name: 'Tibetan' },
  { code: 'en', label: 'ENG', name: 'English' },
  { code: 'pl', label: 'POL', name: 'Polish' },
];

export const UI_LANG_BY_CODE = Object.fromEntries(UI_LANGS.map((l) => [l.code, l]));

const STRINGS = {
  en: {
    forthcoming: 'Translation forthcoming. Support the translator.',
    interfaceLanguage: 'Interface language',
    interfacePending: 'forthcoming',
    couldNotLoadText: 'Could not load this text',
    couldNotLoadCycle: 'Could not load the cycle manifest',
    emptyCycle: 'No texts in the cycle yet.',
  },
  // Tibetan and Polish interface strings are the owner's to supply.
  bo: {},
  pl: {},
};

// Whether the interface actually exists in this language yet.
export function uiLangReady(code) {
  return code === 'en' || Object.keys(STRINGS[code] || {}).length > 0;
}

export function t(key) {
  const table = STRINGS[state.uiLang] || {};
  return table[key] ?? STRINGS.en[key] ?? key;
}
