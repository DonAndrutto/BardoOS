// Where the reader came from — one slot, held in memory.
//
// A cross-link sends the reader out of the passage they were reading
// (an instruction says "recite the Aspiration…", they tap it and they
// are in the prayer). This remembers the exact place they left, so the
// way back can put them there rather than at the top of a long text.
//
// Deliberately not persisted: no reading position survives an app death
// today, and a way back that outlived the reading it belongs to would
// point at a place the reader no longer stands in.

let from = null; // { textId, blockId, offset } — offset is the block's
                 // distance from the top of the viewport when they left

// Record the place a cross-link is being followed from.
//
// A prayer chain keeps the *deeper* origin: instruction → prayer A →
// "Next prayer" → prayer B still goes back to the instruction, which is
// what a reader wants after reciting three prayers in turn. So a link
// followed from a prayer never overwrites an origin that already exists.
export function remember(textId, kind, blockId, offset) {
  if (!textId || !blockId) return;
  if (kind === 'prayer' && from) return;
  from = { textId, blockId, offset };
}

// The place to go back to, or null when the reader is where they chose
// to be rather than where a link sent them.
export function origin() {
  return from;
}

export function forget() {
  from = null;
}
