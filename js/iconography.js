// Shared navigation uses the canonical inline identity marks, never fuzzy names.
export function textForFigure(id) {
  return id.startsWith('trowa.')
    ? 'bardo-thodrol.wrathful-elucidation' : 'bardo-thodrol.dharmata-intro';
}

export function firstFigureMention(text, id) {
  for (const section of text.sections) {
    if (section.plateRef === id) return section.blocks[0]?.id || null;
    for (const block of section.blocks) {
      if (['bo', 'phon', 'en'].some(lang => {
        const value = block[lang];
        const words = Array.isArray(value) ? value.join('\n') : value || '';
        return words.includes(`|${id}]]`);
      })) return block.id;
    }
  }
  return null;
}

export function figureTextHref(id, base = '') {
  return `${base}#${id.startsWith('day.') ? 'plate' : 'deity'}=${encodeURIComponent(id)}`;
}

// One set of gestures for both viewers. A vertical gesture remains scrolling;
// multi-touch remains available for the browser's native image zoom.
export function bindFigureNavigation({ surface, previous, next, active, move, trapFocus = false }) {
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  surface.addEventListener('keydown', event => {
    if (!active() || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); event.stopPropagation();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (trapFocus && event.key === 'Tab') {
      const items = [...surface.querySelectorAll('button, a[href]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  let start = null;
  surface.addEventListener('touchstart', event => {
    start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  surface.addEventListener('touchcancel', () => { start = null; }, { passive: true });
  surface.addEventListener('touchend', event => {
    if (!start || !active()) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  }, { passive: true });
}
