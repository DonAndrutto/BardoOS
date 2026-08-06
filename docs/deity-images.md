# Adding the deity images

The plumbing is in place; the pictures are not. This page is the whole
procedure for the day they arrive. Nothing in it requires a build step,
and nothing here is visible in the app until a real image is on disk.

The roster, when complete, is **42 peaceful and 58 wrathful deities** of
the *bardo* of reality (owner's direction, 2026-08-06). Records may land
one at a time; the validator prints the count on every run and never
fails for an incomplete roster.

## What is already built

| Piece | Where | State |
|---|---|---|
| Record contract | `SCHEMA.md` §9, enforced by `scripts/validate.mjs` | done |
| Roster file | `assets/deities/MANIFEST.json` | `"deities": []` — awaiting the owner |
| Image folder | `assets/deities/images/` | empty |
| Block → deity link | `deityRef` on any block (already in the schema) | done, unused |
| Rendering | `js/render.js` → `.deity-plate` | emits **nothing** unless the record has an `image` |
| Viewer | `index.html` + `js/app.js` (`openDeity`) | built, dormant |
| Offline | `sw.js` precaches every image the manifest names | done |
| Day lookup | `deitiesForDay(day)` in `js/data.js` | seam only — no UI yet |

Because a plate is emitted only when `image` is a real path, the app
today renders exactly as it did before this was added.

## The procedure

### 1. Put the file in `assets/deities/images/`

`.webp` (preferred), `.png`, `.jpg`. Name it after the deity id —
`images/peaceful.vairocana.webp`. Size it for a phone, not a print
shop: the plate caps at 42% of screen height and the viewer at 58%, so
roughly 1200 px on the long edge is plenty. Every image ships in the
offline cache, so weight is a real cost at a hospice's wifi.

### 2. Add its record to `MANIFEST.json`

Every field is written, `null` where a value is absent — the same
discipline as the text blocks, and the validator rejects both unknown
and missing keys:

```json
{
  "id": "TODO-deity-id",
  "bo": "TODO_CONTENT",
  "phon": null,
  "sa": "TODO_CONTENT",
  "en": "TODO_CONTENT",
  "class": "peaceful",
  "day": 1,
  "family": null,
  "consort": null,
  "direction": null,
  "color": null,
  "seed": null,
  "image": "assets/deities/images/TODO-deity-id.webp",
  "attribution": "TODO_CONTENT",
  "license": "TODO_CONTENT"
}
```

- `id` — kebab-case, dots allowed, **stable forever**: it is what a
  block's `deityRef` points at.
- `class` — `peaceful` or `wrathful`. Required.
- `day` — 1–14, or `null` for the deities that belong to no single day
  (the Gaurīs, the Piśācīs, the gatekeepers, the Īśvarīs).
- `consort` — another `id` in this same manifest; the validator checks
  it resolves.
- `image` — omit it (`null`) and the record is still legal: the deity is
  catalogued, no plate renders. **A declared image must exist on disk
  and must carry both `attribution` and `license`** — provenance ships
  with the asset, and the validator will not let an image through
  without it.
- Names are copied from the owner's source, never transliterated or
  translated by whoever is typing (`docs/content-entry.md`, rule 1).
  `TODO_CONTENT` for a gap; the validator counts them.

### 3. Point the passages at it

In `content/texts/<text-id>.json`, set `deityRef` on the blocks that
address that deity:

```json
"deityRef": "peaceful.vairocana",
```

One deity per block. An id not in the manifest is an error
(`orphaned deityRef`). **Which blocks carry a ref is the owner's call**
— the same rule as `prayerRef`. Tooling never infers one.

### 4. Validate and bump

```
node scripts/validate.mjs
```

Then bump `VERSION` in `sw.js` (`bardo-os-v19` → `bardo-os-v20`), or
readers keep serving their cached copy without the pictures.

## What the reader gets

A block with a deityRef whose record has an image shows the plate below
the passage — capped in height, captioned with the deity's name from the
manifest. Tapping it opens the viewer: the image large, the names as the
app writes them everywhere (Tibetan, phonetics, Sanskrit, English), the
manifest's own fields as labelled rows, and the credit line.

The reading position is untouchable, by construction (BRIEF §7): the
viewer is an overlay, so the page beneath never scrolls; the auto-scroll
is held while it is open and resumed on close; focus returns to the
plate that opened it. Closing is the ✕, a tap outside, or Escape.

## Still to decide (not built)

- **The day-by-day lookup** — "tap a day, see who appears" (BRIEF §7).
  `deitiesForDay(day)` exists in `js/data.js` and returns the roster for
  a day; no screen consumes it yet. What that screen should be — a panel
  off the Contents control, a shelf under Iconography beside the Zhitro
  Mandala — is the owner's call.
- **Voice mode.** Plates currently render in both modes: the passage is
  describing the deity who is appearing, and showing that picture at the
  bedside is the point of *liberation upon seeing*. If they should drop
  out of Voice mode, that is one line in `js/render.js` — say the word.
