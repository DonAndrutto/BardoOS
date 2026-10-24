# The deity images

The 42 peaceful deities are in, against the owner's authoritative
`zhiwa-42` image map, and the 58 wrathful deities follow as `trowa-58`,
cut from the owner's Zhitro thangka (see "The wrathful 58" below). This
page records the model, what landed, and the procedure for adding or
replacing figures. Nothing here requires a build step.

## The model

**A deity is an identity; a depiction is a picture.** Keeping them apart
is the whole design:

- **42** independently addressable deity identities.
- **36** depictions — six show a couple in union, thirty show one figure.
- Tapping *either* deity of a pair opens the depiction they share. That
  is not a special case; it is what the model says.
- The gallery shows **36 tiles in the owner's numbering**, pair tiles
  carrying both names.

**Days play no part here.** The day-by-day clusters are a separate
presentation with their own composite images — built since, as *plates*
(`docs/day-plates.md`), and still separate: this feature presents
specific deities and pairs, independently of the day of samādhi. No day
assignment is stored, read, or grouped by, and no plate is assembled out
of these figures.

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
| Days of *dharmatā* | `plateSets` — a separate shape, `docs/day-plates.md` | days 1–7 |
| Offline | `sw.js` precaches every depiction image | done |
| Wrathful 58 | `collections[1]` (`trowa-58`), `assets/deities/images/trowa/` | 58 deities, 53 depictions, 3.9 MB; all 58 marked in `bardo-thodrol.wrathful-elucidation` |

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

## The wrathful 58

**Source.** The owner's Zhitro refuge-tree thangka, `Bardo_Zhitro_100.pdf`
(one embedded image, 2500×3405), read against the owner's labelled copy
of the same painting, which numbers every figure 1–101. The wrathful 58
are thangka nos. 34–38 (the five heruka couples), 39–46 (Gaurīs), 47–54
(Piśācīs), 55–58 (female gatekeepers) and 59–86 (the 28 Īśvarīs: four
circles of six, and the four gatekeeper yoginīs at the lower corners).
Each depiction's `sourceFile` records the thangka number and the exact
crop box in the 2500×3405 original, so every cut can be re-made.

**How they were cut.** Unlike the peaceful set, these are not hand-traced
cut-outs: the figures stand in dense flame-fields and overlap one
another, which no automatic mask follows faithfully. Each figure is
instead cropped from the original at 4:5 around its own body and given a
**feathered oval alpha** — opaque over the figure, falling smoothly to
nothing at the edge — so it still composites onto the app's own ground
and nothing flares white at night. They ship at the peaceful set's
540×675, WebP quality 90. If the owner later supplies traced masters,
they replace these files one for one; ids and text marks do not change.

**Numbering.** The app's own 1–58, in the order the text introduces
them (the thangka's numbers are kept in the table for cross-reference):
1–10 the heruka couples (Buddha, Vajra, Ratna, Padma, Karma — the text's
days 8–12), 11–18 Gaurīs, 19–26 Piśācīs, 27–30 female gatekeepers,
31–54 the Īśvarīs of east, south, west and north (six each), 55–58 the
gatekeeper Īśvarīs. Five pictures show a couple, so 53 depictions carry
58 deities.

**Identities follow the text; the painting confirms them.** Where the
thangka's label and the reading text differ, the text's identity and
order decide the record, and the label is chosen not to contradict
either:

- **#49 Vāyudevī** — text: blue *snake*-headed, brandishing a banner;
  thangka no. 77: cyan, *wolf*-headed, with the banner. Matched on the
  banner and position; labelled "Ishvari of the North, with banner".
- **#50 Nārī** — text: red *ibex*-headed, with a torch; thangka no. 78:
  red, *lizard*-headed, with a stake. Matched on name and position;
  labelled "Ishvari of the North, with torch".
- **#34 Vaiṣṇavī** — text: weasel-headed; thangka no. 62 names her
  *Lobha*, mongoose-headed. Same figure.
- **#40 Saumī** — the thangka's *Chandra* (no. 68); both mean Moon.
- **#52 Vajra Cāmuṇḍī** — the thangka's crow-headed no. 80.
- **Three Rākṣasīs and two Ratis** are distinct records, told apart by
  direction in their ids and by head in their labels.
- **Chemchok Heruka** (Mahottara, thangka centre, with consort) is not
  one of the 58 the text names and is not included. The text's
  "Great Glorious Buddha Heruka" is #01, the centre of the heruka row.

| # | Deity id | Label | Marked in the text as | Where | Thangka no. |
|---|---|---|---|---|---|
| 01 | `trowa.01-buddha-heruka` | Buddha Heruka | Buddha Heruka | `s4-b002` | — |
| 02 | `trowa.02-buddha-krodhishvari` | Buddha Krodhishvari | Buddha-Krodhīśvarī | `s4-b003` | — |
| 03 | `trowa.03-vajra-heruka` | Vajra Heruka | Vajra Heruka | `s5-b002` | 35 |
| 04 | `trowa.04-vajra-krodhishvari` | Vajra Krodhishvari | Vajra-Krodhīśvarī | `s5-b002` | 35 |
| 05 | `trowa.05-ratna-heruka` | Ratna Heruka | Ratna Heruka | `s6-b001` | 36 |
| 06 | `trowa.06-ratna-krodhishvari` | Ratna Krodhishvari | Ratna-Krodhīśvarī | `s6-b002` | 36 |
| 07 | `trowa.07-padma-heruka` | Padma Heruka | Padma Heruka | `s7-b001` | 37 |
| 08 | `trowa.08-padma-krodhishvari` | Padma Krodhishvari | Padma-Krodhīśvarī | `s7-b001` | 37 |
| 09 | `trowa.09-karma-heruka` | Karma Heruka | Karma Heruka | `s8-b001` | 38 |
| 10 | `trowa.10-karma-krodhishvari` | Karma Krodhishvari | Karma-Krodhīśvarī | `s8-b001` | 38 |
| 11 | `trowa.11-gauri` | Gauri — White, of the East | Gaurī | `s9-b002` | 39 |
| 12 | `trowa.12-chauri` | Chauri — Yellow, of the South | Caurī | `s9-b002` | 40 |
| 13 | `trowa.13-pramoha` | Pramoha — Red, of the West | Pramohā | `s9-b002` | 41 |
| 14 | `trowa.14-vetali` | Vetali — Black, of the North | Vetālī | `s9-b002` | 42 |
| 15 | `trowa.15-pukkasi` | Pukkasi — Red-Yellow, of the South-East | Pukkasī | `s9-b003` | 43 |
| 16 | `trowa.16-ghasmari` | Ghasmari — Dark Green, of the South-West | Ghasmarī | `s9-b003` | 44 |
| 17 | `trowa.17-chandali` | Chandali — Pale Yellow, of the North-West | Caṇḍālī | `s9-b003` | 45 |
| 18 | `trowa.18-shmashani` | Shmashani — Dark Blue, of the North-East | Śmaśānī | `s9-b003` | 46 |
| 19 | `trowa.19-simhamukhi` | Simhamukhi — Lion-headed Pishachi | Siṃhamukhī | `s10-b001` | 47 |
| 20 | `trowa.20-vyaghrimukhi` | Vyaghrimukhi — Tiger-headed Pishachi | Vyāghrīmukhī | `s10-b001` | 48 |
| 21 | `trowa.21-shrgalamukhi` | Shrgalamukhi — Fox-headed Pishachi | Śṛgālamukhī | `s10-b001` | 49 |
| 22 | `trowa.22-shvanamukhi` | Shvanamukhi — Wolf-headed Pishachi | Śvānamukhī | `s10-b001` | 50 |
| 23 | `trowa.23-grdhramukhi` | Grdhramukhi — Vulture-headed Pishachi | Gṛdhramukhī | `s10-b002` | 51 |
| 24 | `trowa.24-kankamukhi` | Kankamukhi — Kite-headed Pishachi | Kaṅkamukhī | `s10-b002` | 52 |
| 25 | `trowa.25-kakamukhi` | Kakamukhi — Crow-headed Pishachi | Kākamukhī | `s10-b002` | 53 |
| 26 | `trowa.26-ulukamukhi` | Ulukamukhi — Owl-headed Pishachi | Ulūkamukhī | `s10-b002` | 54 |
| 27 | `trowa.27-ankusha` | Ankusha — Tiger-headed Female Gatekeeper | Aṅkuśā | `s11-b001` | 55 |
| 28 | `trowa.28-pasha` | Pasha — Sow-headed Female Gatekeeper | Pāśā | `s11-b001` | 56 |
| 29 | `trowa.29-sphota` | Sphota — Lion-headed Female Gatekeeper | Sphoṭā | `s11-b001` | 57 |
| 30 | `trowa.30-ghanta` | Ghanta — Snake-headed Female Gatekeeper | Ghaṇṭā | `s11-b001` | 58 |
| 31 | `trowa.31-rakshasi-east` | Rakshasi — Yak-headed Ishvari of the East | Rākṣasī | `s12-b002` | 59 |
| 32 | `trowa.32-brahmani` | Brahmani — Snake-headed Ishvari of the East | Brahmāṇī | `s12-b002` | 60 |
| 33 | `trowa.33-mahadevi` | Mahadevi — Leopard-headed Ishvari of the East | Mahādevī | `s12-b002` | 61 |
| 34 | `trowa.34-vaishnavi` | Vaishnavi — Weasel-headed Ishvari of the East | Vaiṣṇavī | `s12-b002` | 62 |
| 35 | `trowa.35-kaumari` | Kaumari — Brown-Bear-headed Ishvari of the East | Kaumārī | `s12-b002` | 63 |
| 36 | `trowa.36-indrani` | Indrani — Black-Bear-headed Ishvari of the East | Indrāṇī | `s12-b002` | 64 |
| 37 | `trowa.37-rati-south` | Rati — Bat-headed Ishvari of the South | Delight (Rati) | `s12-b003` | 65 |
| 38 | `trowa.38-shanti` | Shanti — Crocodile-headed Ishvari of the South | Peace (Śānti) | `s12-b003` | 66 |
| 39 | `trowa.39-amrita` | Amrita — Scorpion-headed Ishvari of the South | Nectar (Amṛtā) | `s12-b003` | 67 |
| 40 | `trowa.40-saumi` | Saumi — Hawk-headed Ishvari of the South | Moon (Saumī) | `s12-b003` | 68 |
| 41 | `trowa.41-dandi` | Dandi — Fox-headed Ishvari of the South | Club-Bearer (Daṇḍī) | `s12-b003` | 69 |
| 42 | `trowa.42-rakshasi-south` | Rakshasi — Tiger-headed Ishvari of the South | Rākṣasī | `s12-b003` | 70 |
| 43 | `trowa.43-bhakshasi` | Bhakshasi — Vulture-headed Ishvari of the West | Devourer (Bhakṣasī) | `s12-b004` | 71 |
| 44 | `trowa.44-rati-west` | Rati — Horse-headed Ishvari of the West | Delight (Ratī) | `s12-b004` | 72 |
| 45 | `trowa.45-mahabala` | Mahabala — Garuda-headed Ishvari of the West | Mighty One (Mahābalā) | `s12-b004` | 73 |
| 46 | `trowa.46-rakshasi-west` | Rakshasi — Dog-headed Ishvari of the West | Rākṣasī | `s12-b004` | 74 |
| 47 | `trowa.47-kama` | Kama — Hoopoe-headed Ishvari of the West | Desire (Kāmā) | `s12-b004` | 75 |
| 48 | `trowa.48-vasurakshita` | Vasurakshita — Deer-headed Ishvari of the West | Wealth-Guardian (Vasurakṣitā) | `s12-b004` | 76 |
| 49 | `trowa.49-vayudevi` | Vayudevi — Ishvari of the North, with banner | Wind Goddess (Vāyudevī) | `s12-b005` | 77 |
| 50 | `trowa.50-nari` | Nari — Ishvari of the North, with torch | Woman (Nārī) | `s12-b005` | 78 |
| 51 | `trowa.51-varahi` | Varahi — Sow-headed Ishvari of the North | Vārāhī | `s12-b005` | 79 |
| 52 | `trowa.52-chamundi` | Vajra Chamundi — Crow-headed Ishvari of the North | Vajra Cāmuṇḍī | `s12-b005` | 80 |
| 53 | `trowa.53-mahanasa` | Mahanasa — Elephant-headed Ishvari of the North | Great-Nosed One (Mahānāsā) | `s12-b005` | 81 |
| 54 | `trowa.54-varuni` | Varuni — Snake-headed Ishvari of the North | Water Goddess (Vāruṇī) | `s12-b005` | 82 |
| 55 | `trowa.55-mahakali` | Vajra Mahakali — Cuckoo-headed Gatekeeper Ishvari | Vajra Mahākālī | `s12-b006` | 83 |
| 56 | `trowa.56-mahachagala` | Vajra Mahachagala — Goat-headed Gatekeeper Ishvari | Vajra Mahācchāgalā | `s12-b006` | 84 |
| 57 | `trowa.57-mahakumbhakarni` | Vajra Mahakumbhakarni — Lion-headed Gatekeeper Ishvari | Vajra Mahākumbhakarṇī | `s12-b006` | 85 |
| 58 | `trowa.58-lambodara` | Vajra Lambodara — Snake-headed Gatekeeper Ishvari | Vajra Lambodarā | `s12-b006` | 86 |

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

## The procedure, for adding or replacing a set

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

A name the owner marked stands in the accent colour with a dotted rule
beneath it — the same size and weight as the words around it, because a
name is still part of the sentence, but visibly a way in, so the reader
can see at a glance which names open a figure. (It read in the text's own
colour until the owner asked for it to be plainer, 2026-08-14.) Tapping it
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

- ~~**The cluster presentation.**~~ Built 2026-08-22 as the day plates,
  in its own shape and its own document: `docs/day-plates.md`. It stayed
  out of this data model, as intended — no day is stored or read here,
  and a plate is one supplied picture rather than a group assembled from
  these figures.
- **A name marked more than once.** Today each deity is marked in the
  one passage that introduces it. If a later mention should also be
  tappable, that is one more marker, placed by the owner.
