# The day plates

The days of the *bardo* of *dharmatā* now have their pictures. This is
the presentation `docs/deity-images.md` left open and BRIEF §7 asked for
in its first line — *tap a day, see who appears*. Nothing here requires
a build step.

## The model

**A plate is a picture of a whole arising.** That is the whole of it,
and it is deliberately not the deity model:

- A **deity** is an identity and a **depiction** is a picture, which is
  why they are kept apart — six pictures carry twelve deities between
  them, so a tap on either half of a couple has to resolve to the one
  picture they share.
- A **plate** has nothing to resolve. Its identity and its picture are
  the same thing: one day, one composite, supplied whole by the owner.
  No roster is stored, no figure inside it is addressable, and no plate
  is assembled out of the 36 cut-out figures.

The two live in one manifest and share one viewer, and they stay
separate everywhere else. In particular the deity records still carry no
day: a deity's optional `day` field means nothing to this feature, and
`plateRef` is not derived from it.

## What is built

| Piece | Where | State |
|---|---|---|
| Contract | `SCHEMA.md` §3 (`plateRef`) and §9 (plate sets), enforced by `scripts/validate.mjs` | done |
| Manifest | `assets/deities/MANIFEST.json` → `plateSets[0]` | one set, `days-1-7`, 7 plates |
| Images | `assets/deities/images/days/` | 7 WebP, 3.8 MB |
| Heading → plate | `"plateRef"` on the section (`SCHEMA.md` §3) | all seven days marked in `bardo-thodrol.dharmata-intro` |
| Viewer | `index.html` + `js/app.js` (`openPlate`) | shares the figures' overlay |
| Gallery | Iconography → Days 1–7 (`renderDeities` in `js/home.js`) | done |
| Offline | `sw.js` precaches every plate | done |
| Days 8–14 | — | awaiting the images; the wrathful days are a second set when they come |

## The images

The owner supplied seven PNG masters, 7.0 MB in total: six at
1080 × 1350 with transparency, and the seventh day — the awareness
holders — opaque at 1402 × 1122. They ship as WebP at **quality 95**,
**3.8 MB**, with the **alpha channel bit-identical** to the source on
every one of the six that has one, verified per file at conversion. The
masters stay with the owner; each plate records its `sourceFile`.
Conversion was a one-time local step with Pillow, never a dependency of
the app.

A plate is heavier than a cut-out figure — a composite is a whole
painting, where a cut-out is mostly transparency — so seven plates cost
about what all 36 figures do. That is the real price of the offline
guarantee, and worth knowing before a second set is added.

| # | Plate id | Marked on | Master |
|---|---|---|---|
| 1 | `day.01-vairocana` | `s3` The First Day — Vairocana | `THE FIRST DAY — VAIROCANA.png` |
| 2 | `day.02-vajrasattva-akshobhya` | `s4` The Second Day — Vajrasattva-Akṣobhya | `THE SECOND DAY — VAJRASATTVA-AKṢOBHYA.png` |
| 3 | `day.03-ratnasambhava` | `s5` The Third Day — Ratnasambhava | `THE THIRD DAY — RATNASAMBHAVA.png` |
| 4 | `day.04-amitabha` | `s6` The Fourth Day — Amitābha | `THE FOURTH DAY — AMITĀBHA.png` |
| 5 | `day.05-amoghasiddhi` | `s7` The Fifth Day — Amoghasiddhi | `THE FIFTH DAY — AMOGHASIDDHI.png` |
| 6 | `day.06-five-families-together` | `s8` The Sixth Day — The Five Families Together | `THE SIXTH DAY — THE FIVE FAMILIES TOGETHER.png` |
| 7 | `day.07-awareness-holders` | `s9` The Seventh Day — The Awareness Holders | `THE SEVENTH DAY — THE AWARENESS HOLDERS 1.png` |

The plate labels are the day headings as the text already gives them, so
the gallery and the viewer name a day exactly as the passage does.

## What the reader gets

A day's heading that carries a plate keeps its own words, size, weight
and place — it is still the heading of that day — and gains a dotted
rule beneath the words and a small picture glyph after them. The dotted
rule is the figures' own treatment, so both ways in read alike; the
glyph does the work colour cannot, since every heading in the app is
already in the accent colour. A heading with no plate is untouched.

Tapping it brings the plate over the page, with the day's name beneath
it and the ✕, a tap outside, or Escape to dismiss. The reading position
is untouchable, by construction (BRIEF §7): the viewer is an overlay, so
the page beneath never scrolls; the auto-scroll is held while it is open
and resumed on close; focus returns to the heading that opened it. This
holds in Voice mode too, where the passage being read aloud is the very
description of what the plate shows.

Under Iconography the set opens as its own gallery — tiles in the
owner's numbering, each named as its day is named, wider than a figure's
tile because a plate is a whole assembly and the faces in it have to
stay legible. Each shelf entry now opens only its own set: the figures
and the days are two galleries, not one page of everything.

## Adding the next set (days 8–14)

### 1. Convert and place the images

`.webp` (preferred), `.png`, `.jpg`, under
`assets/deities/images/<set>/`. If they arrive as PNG, convert as these
did — WebP quality 95, and **verify the alpha channel is bit-identical**
per file before committing. Every image ships in the offline cache, so
weight is a real cost on a hospice's wifi.

### 2. Add the set to `MANIFEST.json`

A second entry in `plateSets[]`, beside `days-1-7`; the fields are in
`SCHEMA.md` §9. Ids are stable forever — an id is what a section's
`plateRef` points at — and must not collide with a deity id.

### 3. Mark the headings

One `"plateRef": "<plate-id>"` on the section whose heading names that
day. The wrathful days live in
`content/texts/bardo-thodrol.wrathful-elucidation.json`. The heading's
words are never touched; the marking only says which plate it opens.

### 4. Validate and bump

```
node scripts/validate.mjs
```

Then bump `VERSION` in `sw.js`, or readers keep serving their cached
copy without the new plates.

## Still to decide (not built)

- **Days 8–14**, the wrathful arisings, and whether the seventh day's
  master is one plate or the first of several — it arrived numbered `1`.
  Both are the owner's call when the images exist.
- **A plate for a section outside the day sequence.** The mechanism is
  general — any section may carry a `plateRef` — but nothing outside
  these seven days is marked, and nothing should be without the owner
  saying so.
