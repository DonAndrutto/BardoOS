# The deity images

The 42 peaceful deities are in. This page records what landed, how the
mapping was made, and the procedure for the wrathful 58 when they follow.
Nothing here requires a build step.

The roster, when complete, is **42 peaceful and 58 wrathful deities** of
the *bardo* of reality (owner's direction, 2026-08-06). The validator
prints the count on every run and never fails for an incomplete roster.

## What is built

| Piece | Where | State |
|---|---|---|
| Record contract | `SCHEMA.md` §9, enforced by `scripts/validate.mjs` | done |
| Roster | `assets/deities/MANIFEST.json` | **42 peaceful**, each with an image |
| Images | `assets/deities/images/zhiwa/` | **36 WebP**, 3.7 MB |
| Name in the text → figure | `[[words\|deity-id]]` (`SCHEMA.md` §4) | done — all 42 named in `bardo-thodrol.dharmata-intro` |
| Viewer | `index.html` + `js/app.js` (`openDeity`) | done |
| Gallery | Iconography → Peaceful Deities (`renderDeities` in `js/home.js`) | done |
| Offline | `sw.js` precaches every image the manifest names | done |
| Day cluster | `deitiesForDay(day)` in `js/data.js` | seam only — the gallery groups by day; no cluster screen yet |
| Wrathful 58 | — | awaiting the images |

## The images

The owner supplied 36 PNGs at 540×675 RGBA, cut out with no background,
24.2 MB in total. They ship as WebP at **quality 95** — **3.7 MB**, with
the **alpha channel bit-identical** to the source on every one of the 36
(verified per file at conversion; the owner's condition was that the
transparency survive exactly). The PNG masters stay with the owner; only
the WebP is committed. Conversion was a one-time local step with Pillow,
never a dependency of the app.

Six files show a couple in union, so **36 images carry 42 deities** — the
two records share one `image` path and point at each other through
`consort`. The gallery draws one tile for such a pair, under both names.

**The transparency is doing real work.** A cut-out composites onto the
app's own ground, so at 3 a.m. in night mode nothing flares white; the
viewer needs no panel and no frame; and figures can be composed side by
side without seams, which is what will make the day-cluster view possible.

## The mapping — please check this

Two of the owner's own sources are involved, and they are not always the
same: the **translation** (which spells the names, and states the day) and
the **file labels** (which the gallery shows). Both are recorded as they
stand; nothing was reconciled by tooling.

Two places where they genuinely differ, for the owner to settle:

- **28** — the file says *Goddess of Food and Taste* (Naivedyā); the
  translation says **Nartī**. Different names for the eighth offering
  goddess.
- **31** — the file says *Shakyamuni*; the translation says
  **Śākyasiṃha, sage of humans**. Matched by its position in the owner's
  own list of six sages.

Also worth an eye: **19** is *Sarvanivaranavishkambhin* on the file and
**Nivāraṇaviṣkambhin** in the text; **15** (the bodhisattva) and **01**
(the primordial buddha) are both *Samantabhadra* and are deliberately two
records, marked in two different passages.

Still owed by the owner, and reported by the validator on every run:
`attribution` and `license` (one line covers all 36), plus `bo`, `family`,
`direction`, `color` and `seed` on each record.

| # | Image file | Named in the text as | Where | Gallery label | Day |
|---|---|---|---|---|---|
| 01 | `01-02-samantabhadra-and-samantabhadri.webp` | Samantabhadra | `s8-b004` | Samantabhadra | 6 |
| 02 | `01-02-samantabhadra-and-samantabhadri.webp` | Samantabhadrī | `s8-b004` | Samantabhadri | 6 |
| 03 | `03-04-vairochana-and-dhatvishvari.webp` | Vairocana | `s3-b001` | Vairochana | 1 |
| 04 | `03-04-vairochana-and-dhatvishvari.webp` | Ākāśadhātvīśvarī | `s3-b001` | Dhatvishvari | 1 |
| 05 | `05-06-akshobhya-and-buddhalochana.webp` | Vajrasattva-Akṣobhya | `s4-b001` | Akshobhya | 2 |
| 06 | `05-06-akshobhya-and-buddhalochana.webp` | Buddhalocanā | `s4-b001` | Buddhalochana | 2 |
| 07 | `07-08-ratnasambhava-and-mamaki.webp` | Ratnasambhava | `s5-b001` | Ratnasambhava | 3 |
| 08 | `07-08-ratnasambhava-and-mamaki.webp` | Māmakī | `s5-b001` | Mamaki | 3 |
| 09 | `09-10-amitabha-and-pandaravasini.webp` | Amitābha | `s6-b001` | Amitabha | 4 |
| 10 | `09-10-amitabha-and-pandaravasini.webp` | Pāṇḍaravāsinī | `s6-b001` | Pandaravasini | 4 |
| 11 | `11-12-amoghasiddhi-and-samayatara.webp` | Amoghasiddhi | `s7-b002` | Amoghasiddhi | 5 |
| 12 | `11-12-amoghasiddhi-and-samayatara.webp` | Samayatārā | `s7-b002` | Samayatara | 5 |
| 13 | `13-kshitigarbha.webp` | Kṣitigarbha | `s4-b001` | Kshitigarbha | 2 |
| 14 | `14-maitreya.webp` | Maitreya | `s4-b001` | Maitreya | 2 |
| 15 | `15-samantabhadra-bodhisattva.webp` | Samantabhadra | `s5-b001` | Samantabhadra Bodhisattva | 3 |
| 16 | `16-akashagarbha.webp` | Ākāśagarbha | `s5-b001` | Akashagarbha | 3 |
| 17 | `17-avalokiteshvara.webp` | Avalokiteśvara | `s6-b001` | Avalokiteshvara | 4 |
| 18 | `18-manjushri.webp` | Mañjuśrī | `s6-b001` | Manjushri | 4 |
| 19 | `19-sarvanivaranavishkambhin.webp` | Nivāraṇaviṣkambhin | `s7-b002` | Sarvanivaranavishkambhin | 5 |
| 20 | `20-vajrapani.webp` | Vajrapāṇi | `s7-b002` | Vajrapani | 5 |
| 21 | `21-goddess-of-beauty-with-mirror.webp` | Lāsyā | `s4-b001` | Goddess of Beauty with Mirror | 2 |
| 22 | `22-goddess-of-flowers.webp` | Puṣpā | `s4-b001` | Goddess of Flowers | 2 |
| 23 | `23-goddess-of-garlands.webp` | Mālyā | `s5-b001` | Goddess of Garlands | 3 |
| 24 | `24-goddess-of-incense.webp` | Dhūpā | `s5-b001` | Goddess of Incense | 3 |
| 25 | `25-goddess-of-song.webp` | Gītā | `s6-b001` | Goddess of Song | 4 |
| 26 | `26-goddess-of-light.webp` | Ālokā | `s6-b001` | Goddess of Light | 4 |
| 27 | `27-goddess-of-perfume.webp` | Gandhā | `s7-b002` | Goddess of Perfume | 5 |
| 28 | `28-goddess-of-food-and-taste.webp` | Nartī | `s7-b002` | Goddess of Food and Taste | 5 |
| 29 | `29-indra-kaushika-buddha-of-the-god-realm.webp` | Indra of a Hundred Sacrifices | `s8-b004` | Indra Kaushika, Buddha of the God Realm | 6 |
| 30 | `30-vemachitra-buddha-of-the-demi-god-realm.webp` | Vemacitra | `s8-b004` | Vemachitra, Buddha of the Demi God Realm | 6 |
| 31 | `31-shakyamuni-buddha-of-the-human-realm.webp` | Śākyasiṃha | `s8-b004` | Shakyamuni, Buddha of the Human Realm | 6 |
| 32 | `32-sthirasimha-buddha-of-the-animal-realm.webp` | Sthirasiṃha | `s8-b004` | Sthirasimha, Buddha of the Animal Realm | 6 |
| 33 | `33-jvalamukha-buddha-of-the-hungry-ghost-realm.webp` | Jvālamukha | `s8-b004` | Jvalamukha, Buddha of the Hungry Ghost Realm | 6 |
| 34 | `34-dharmaraja-buddha-of-the-hell-realm.webp` | Dharmarāja | `s8-b004` | Dharmaraja, Buddha of the Hell Realm | 6 |
| 35 | `35-vijaya-gatekeeper.webp` | Vijaya the Victorious | `s8-b004` | Vijaya, Gatekeeper | 6 |
| 36 | `36-yamantaka-gatekeeper.webp` | Yamāntaka Slayer of the Lord of Death | `s8-b004` | Yamantaka, Gatekeeper | 6 |
| 37 | `37-hayagriva-gatekeeper.webp` | Hayagrīva the Horse-Necked King | `s8-b004` | Hayagriva, Gatekeeper | 6 |
| 38 | `38-amritakundali-gatekeeper.webp` | Amṛtakuṇḍalin Coil of Nectar | `s8-b004` | Amritakundali, Gatekeeper | 6 |
| 39 | `39-ankusha-female-gatekeeper.webp` | She of the Hook | `s8-b004` | Ankusha, Female Gatekeeper | 6 |
| 40 | `40-pasha-female-gatekeeper.webp` | She of the Noose | `s8-b004` | Pasha, Female Gatekeeper | 6 |
| 41 | `41-shrinkhala-female-gatekeeper.webp` | She of the Chain | `s8-b004` | Shrinkhala, Female Gatekeeper | 6 |
| 42 | `42-ghanta-female-gatekeeper.webp` | She of the Bell | `s8-b004` | Ghanta, Female Gatekeeper | 6 |

## Marking a name in the text

A deity's name becomes tappable by wrapping the words **already in the
text** (`SCHEMA.md` §4):

```
the Blessed [[Vairocana|zhiwa.03-vairochana]] will dawn before you
```

- Words first, id second. The words are copied character for character
  from the passage — a marker is added, nothing is ever reworded.
- One mark per deity, in the passage that introduces it: that keeps every
  deity reachable while leaving the reading surface calm. Vairocana is
  named in six blocks of `s3`; one is enough.
- Longest name first when a block holds several, or `Samantabhadra` will
  be taken out of the middle of `Samantabhadrī`.
- The id must be in the manifest, or the validator fails. Where the
  manifest holds no image for it, the words simply render as plain text.

## The procedure, for the wrathful 58

### 1. Convert and place the images

`.webp` (preferred), `.png`, `.jpg`, under
`assets/deities/images/<set>/`. If they arrive as PNG, convert as the
peaceful set was — WebP quality 95, and **verify the alpha channel is
bit-identical** per file before committing. Every image ships in the
offline cache, so weight is a real cost on a hospice's wifi: 36 files
went from 24.2 MB to 3.7 MB with no visible change.

### 2. Add each record to `MANIFEST.json`

Every field is written, `null` where a value is absent — the same
discipline as the text blocks, and the validator rejects both unknown
and missing keys:

```json
{
  "id": "trowa.01-TODO",
  "bo": "TODO_CONTENT",
  "phon": null,
  "sa": "TODO_CONTENT",
  "en": "TODO_CONTENT",
  "class": "wrathful",
  "day": 8,
  "family": "TODO_CONTENT",
  "consort": null,
  "direction": "TODO_CONTENT",
  "color": "TODO_CONTENT",
  "seed": "TODO_CONTENT",
  "image": "assets/deities/images/trowa/TODO.webp",
  "attribution": "TODO_CONTENT",
  "license": "TODO_CONTENT"
}
```

- `id` — kebab-case, dots allowed, **stable forever**: it is what an
  inline token points at. The peaceful set uses `zhiwa.NN-name`, the
  owner's own numbering.
- `class` — `peaceful` or `wrathful`. Required.
- `day` — 1–14, or `null` for a deity the text ties to no single day.
- `consort` — another `id` in this same manifest; the validator checks
  it resolves. Two records may share one `image` when the picture shows
  them in union.
- `image` — omit it (`null`) and the record is still legal: the deity is
  catalogued, nothing renders, and its name in the text stays plain
  words. **A declared image must exist on disk and must carry both
  `attribution` and `license`** — provenance ships with the asset, and
  the validator will not let an image through without it.
- Names are copied from the owner's sources, never transliterated or
  translated by whoever is typing (`docs/content-entry.md`, rule 1).
  `TODO_CONTENT` for a gap; the validator counts them.

### 3. Mark the names in the text

See "Marking a name in the text" above. The wrathful days live in
`content/texts/bardo-thodrol.wrathful-elucidation.json`.

### 4. Validate and bump

```
node scripts/validate.mjs
```

Then bump `VERSION` in `sw.js`, or readers keep serving their cached
copy without the new figures.

## What the reader gets

A name the owner marked carries a dotted rule beneath it in the reading
text — the same size, weight and colour as the words around it, so it is
findable when looked for and never competes with the passage. Tapping it
brings the figure over the page: large, on the page's own ground with no
frame, the names beneath it, and whatever the manifest holds (day,
family, direction, colour, seed syllable, consort) as labelled rows. The
✕, a tap anywhere outside, or Escape dismisses it.

The reading position is untouchable, by construction (BRIEF §7): the
viewer is an overlay, so the page beneath never scrolls; the auto-scroll
is held while it is open and resumed on close; focus returns to the name
that opened it. This holds in Voice mode too, where the figure is
arguably most wanted — the passage is describing the deity who is
appearing.

Under Iconography, **Peaceful Deities** shows the whole roster as
figures, grouped by the day each dawns, named by the owner's file
labels. Tapping a tile opens the same viewer.

## Still to decide (not built)

- **The day cluster.** `deitiesForDay(day)` returns a day's roster and
  the gallery already groups by it; what a cluster *screen* should be —
  the six of a day composed together, off the Contents control or off
  the day's heading — is the owner's call. The cut-outs compose without
  seams, which is what makes it possible.
- **A name marked more than once.** Today each deity is marked in the
  one passage that introduces it. If a later mention should also be
  tappable, that is one more marker, placed by the owner.
