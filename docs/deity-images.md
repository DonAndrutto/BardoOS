# The deity images

The 42 peaceful deities are in, against the owner's authoritative
`zhiwa-42` image map. This page records the model, what landed, and the
procedure for the wrathful 58 when they follow. Nothing here requires a
build step.

## The model

**A deity is an identity; a depiction is a picture.** Keeping them apart
is the whole design:

- **42** independently addressable deity identities.
- **36** depictions — six show a couple in union, thirty show one figure.
- Tapping *either* deity of a pair opens the depiction they share. That
  is not a special case; it is what the model says.
- The gallery shows **36 tiles in the owner's numbering**, pair tiles
  carrying both names.

**Days play no part here.** The day-by-day clusters are a separate future
presentation with their own composite images; this feature presents
specific deities and pairs, independently of the day of samādhi. No day
assignment is stored, read, or grouped by.

The only required information per deity is its **number**, its stable
**id**, its **label**, and its **depiction association** (plus the
depiction's image path). `bo`, `family`, `direction`, `color`, `seed`
and `day` are accepted as genuinely optional future metadata — absent is
normal, never a warning, never filled with a placeholder, never shown.

## What is built

| Piece | Where | State |
|---|---|---|
| Contract | `SCHEMA.md` §9, enforced by `scripts/validate.mjs` | done |
| Manifest | `assets/deities/MANIFEST.json` | 42 deities, 36 depictions, one collection |
| Images | `assets/deities/images/zhiwa/` | 36 WebP, 3.7 MB |
| Name in the text → figure | `[[words\|deity-id]]` (`SCHEMA.md` §4) | all 42 marked in `bardo-thodrol.dharmata-intro` |
| Viewer | `index.html` + `js/app.js` (`openDeity`) | done |
| Gallery | Iconography → 42 Peaceful Deities (`renderDeities` in `js/home.js`) | done |
| Offline | `sw.js` precaches every depiction image | done |
| Wrathful 58 | — | awaiting the images; `collections[]` already holds a second set |

## The images

The owner supplied 36 PNGs at 540×675 RGBA, cut out with no background,
24.2 MB in total. They ship as WebP at **quality 95** — **3.7 MB**, with
the **alpha channel bit-identical** to the source on every one of the 36
(verified per file at conversion; the owner's condition was that the
transparency survive exactly). The PNG masters stay with the owner; each
depiction records its `sourceFile`. Conversion was a one-time local step
with Pillow, never a dependency of the app.

**The transparency is doing real work.** A cut-out composites onto the
app's own ground, so at 3 a.m. in night mode nothing flares white; the
viewer needs no panel and no frame; and figures can be composed side by
side without seams, which is what will make the cluster presentation
possible when it comes.

## Attribution and licence

Collection-level, because all 36 pictures share one provenance:
`collections[0].attribution` and `.license`. Both are `null` until the
owner supplies the wording; while they are null the viewer and the
gallery simply show no credit line.

## Names

The reading text keeps its own words — those are the tap targets. The
manifest's `label` is the canonical name shown in the viewer and the
gallery. Where the two differ, `textAliases` records the relationship as
**documentation only**: the renderer never infers a deity reference from
prose, and a name becomes a tap solely where the owner marked it.

- **#28 is Naivedyā — Goddess of Food and Taste** (the carrier of
  foodstuffs; her colour and position in the maṇḍala confirm it). The
  passage still reads `Nartī`, and that word is an explicit reference to
  `zhiwa.28-naivedya`. Aliases recorded: Nartī, Narti, Nīrti, Nirti.
- **#19** — `Sarvanivaranavishkambhin` on the file,
  `Nivāraṇaviṣkambhin` in the text: one record.
- **#31** — `Shakyamuni` on the file, `Śākyasiṃha, sage of humans` in
  the text: one record, the human-realm figure.
- **#01 and #15** are separate records — the primordial Buddha
  Samantabhadra and Samantabhadra Bodhisattva — marked in two different
  passages.

| # | Deity id | Label | Marked in the text as | Where | Depiction |
|---|---|---|---|---|---|
| 01 | `zhiwa.01-samantabhadra` | Samantabhadra | Samantabhadra | `s8-b004` | `01-02` *(pair)* |
| 02 | `zhiwa.02-samantabhadri` | Samantabhadri | Samantabhadrī | `s8-b004` | `01-02` *(pair)* |
| 03 | `zhiwa.03-vairochana` | Vairochana | Vairocana | `s3-b001` | `03-04` *(pair)* |
| 04 | `zhiwa.04-dhatvishvari` | Dhatvishvari | Ākāśadhātvīśvarī | `s3-b001` | `03-04` *(pair)* |
| 05 | `zhiwa.05-akshobhya` | Akshobhya | Vajrasattva-Akṣobhya | `s4-b001` | `05-06` *(pair)* |
| 06 | `zhiwa.06-buddhalochana` | Buddhalochana | Buddhalocanā | `s4-b001` | `05-06` *(pair)* |
| 07 | `zhiwa.07-ratnasambhava` | Ratnasambhava | Ratnasambhava | `s5-b001` | `07-08` *(pair)* |
| 08 | `zhiwa.08-mamaki` | Mamaki | Māmakī | `s5-b001` | `07-08` *(pair)* |
| 09 | `zhiwa.09-amitabha` | Amitabha | Amitābha | `s6-b001` | `09-10` *(pair)* |
| 10 | `zhiwa.10-pandaravasini` | Pandaravasini | Pāṇḍaravāsinī | `s6-b001` | `09-10` *(pair)* |
| 11 | `zhiwa.11-amoghasiddhi` | Amoghasiddhi | Amoghasiddhi | `s7-b002` | `11-12` *(pair)* |
| 12 | `zhiwa.12-samayatara` | Samayatara | Samayatārā | `s7-b002` | `11-12` *(pair)* |
| 13 | `zhiwa.13-kshitigarbha` | Kshitigarbha | Kṣitigarbha | `s4-b001` | `13` |
| 14 | `zhiwa.14-maitreya` | Maitreya | Maitreya | `s4-b001` | `14` |
| 15 | `zhiwa.15-samantabhadra-bodhisattva` | Samantabhadra Bodhisattva | Samantabhadra | `s5-b001` | `15` |
| 16 | `zhiwa.16-akashagarbha` | Akashagarbha | Ākāśagarbha | `s5-b001` | `16` |
| 17 | `zhiwa.17-avalokiteshvara` | Avalokiteshvara | Avalokiteśvara | `s6-b001` | `17` |
| 18 | `zhiwa.18-manjushri` | Manjushri | Mañjuśrī | `s6-b001` | `18` |
| 19 | `zhiwa.19-sarvanivaranavishkambhin` | Sarvanivaranavishkambhin | Nivāraṇaviṣkambhin | `s7-b002` | `19` |
| 20 | `zhiwa.20-vajrapani` | Vajrapani | Vajrapāṇi | `s7-b002` | `20` |
| 21 | `zhiwa.21-goddess-of-beauty-with-mirror` | Goddess of Beauty with Mirror | Lāsyā | `s4-b001` | `21` |
| 22 | `zhiwa.22-goddess-of-flowers` | Goddess of Flowers | Puṣpā | `s4-b001` | `22` |
| 23 | `zhiwa.23-goddess-of-garlands` | Goddess of Garlands | Mālyā | `s5-b001` | `23` |
| 24 | `zhiwa.24-goddess-of-incense` | Goddess of Incense | Dhūpā | `s5-b001` | `24` |
| 25 | `zhiwa.25-goddess-of-song` | Goddess of Song | Gītā | `s6-b001` | `25` |
| 26 | `zhiwa.26-goddess-of-light` | Goddess of Light | Ālokā | `s6-b001` | `26` |
| 27 | `zhiwa.27-goddess-of-perfume` | Goddess of Perfume | Gandhā | `s7-b002` | `27` |
| 28 | `zhiwa.28-naivedya` | Naivedyā — Goddess of Food and Taste | Nartī | `s7-b002` | `28` |
| 29 | `zhiwa.29-indra-kaushika` | Indra Kaushika — Buddha of the God Realm | Indra of a Hundred Sacrifices | `s8-b004` | `29` |
| 30 | `zhiwa.30-vemachitra` | Vemachitra — Buddha of the Demi-God Realm | Vemacitra | `s8-b004` | `30` |
| 31 | `zhiwa.31-shakyamuni` | Shakyamuni — Buddha of the Human Realm | Śākyasiṃha | `s8-b004` | `31` |
| 32 | `zhiwa.32-sthirasimha` | Sthirasimha — Buddha of the Animal Realm | Sthirasiṃha | `s8-b004` | `32` |
| 33 | `zhiwa.33-jvalamukha` | Jvalamukha — Buddha of the Hungry Ghost Realm | Jvālamukha | `s8-b004` | `33` |
| 34 | `zhiwa.34-dharmaraja` | Dharmaraja — Buddha of the Hell Realm | Dharmarāja | `s8-b004` | `34` |
| 35 | `zhiwa.35-vijaya` | Vijaya — Gatekeeper | Vijaya the Victorious | `s8-b004` | `35` |
| 36 | `zhiwa.36-yamantaka` | Yamantaka — Gatekeeper | Yamāntaka Slayer of the Lord of Death | `s8-b004` | `36` |
| 37 | `zhiwa.37-hayagriva` | Hayagriva — Gatekeeper | Hayagrīva the Horse-Necked King | `s8-b004` | `37` |
| 38 | `zhiwa.38-amritakundali` | Amritakundali — Gatekeeper | Amṛtakuṇḍalin Coil of Nectar | `s8-b004` | `38` |
| 39 | `zhiwa.39-ankusha` | Ankusha — Female Gatekeeper | She of the Hook | `s8-b004` | `39` |
| 40 | `zhiwa.40-pasha` | Pasha — Female Gatekeeper | She of the Noose | `s8-b004` | `40` |
| 41 | `zhiwa.41-shrinkhala` | Shrinkhala — Female Gatekeeper | She of the Chain | `s8-b004` | `41` |
| 42 | `zhiwa.42-ghanta` | Ghanta — Female Gatekeeper | She of the Bell | `s8-b004` | `42` |

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

### 2. Add the collection to `MANIFEST.json`

A second entry in `collections[]`, beside `zhiwa-42`:

```json
{
  "id": "trowa-58",
  "label": "58 Wrathful Deities",
  "attribution": null,
  "license": null,
  "deities": [
    { "number": 1, "id": "trowa.01-TODO", "label": "TODO" }
  ],
  "depictions": [
    {
      "id": "trowa.depiction.01",
      "sourceFile": "01_TODO.png",
      "image": "assets/deities/images/trowa/01-todo.webp",
      "deityIds": ["trowa.01-TODO"]
    }
  ]
}
```

- `number`, `id`, `label` on a deity; `id`, `sourceFile`, `image`,
  `deityIds` on a depiction. Nothing else is required, and no optional
  field should be filled with a placeholder.
- Ids are **stable forever**: an id is what an inline token points at.
- A picture showing two figures lists both in `deityIds`, and both
  names appear on its tile and in its viewer.
- No deity may be shown by two depictions — a tap would have two
  answers, and the validator says so.
- A deity with no depiction is legal: catalogued, and its name in the
  text stays plain words.

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
frame, and beneath it the name of every deity that picture shows — one
for a single figure, both for a couple in union. The ✕, a tap anywhere
outside, or Escape dismisses it.

The reading position is untouchable, by construction (BRIEF §7): the
viewer is an overlay, so the page beneath never scrolls; the auto-scroll
is held while it is open and resumed on close; focus returns to the name
that opened it. This holds in Voice mode too, where the figure is
arguably most wanted — the passage is describing the deity who is
appearing.

Under Iconography, each collection opens as a gallery of its depictions
in the owner's numbering, pair tiles carrying both names. Tapping a tile
opens the same viewer.

## Still to decide (not built)

- **The cluster presentation.** A separate future feature with its own
  composite images, showing the group that dawns on a given day. It is
  deliberately absent from this data model — no day is stored or read
  here — and designing it is the owner's call when the images exist.
- **A name marked more than once.** Today each deity is marked in the
  one passage that introduces it. If a later mention should also be
  tappable, that is one more marker, placed by the owner.
