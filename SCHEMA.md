# Bardo OS content schema

**Status: APPROVED and frozen (Phase 0 sign-off, 2026-07-16), with the amendments named at that approval: `phon` required on L3 only; `form` gains `title` and `colophon`. Any further change requires asking first (BRIEF §6).**

**Phase 3 amendments (owner-directed, 2026-07-18):** blocks gain two optional fields — `prayerRef` (cross-link to a prayer in the cycle; the validator rejects orphaned refs) and `pl` (Polish translation, entirely optional on every layer, default null); `kind` gains `"guide"` and `cycle` gains `"app"` for the app's own Guide texts (Introduction, How to Use This App). No existing field changed meaning.

**Phase 4 amendments (owner-directed, 2026-08-06):** (0) a third inline token, `[[words|deity-id]]`, marks a deity's name where the text already names it, so tapping it shows the figure (BRIEF §7). Like `**…**` it is a paired marker placed around text that is already there — the words between the brackets are never edited. (1) `prayerRef` may now be an **array** of text ids as well as a single id — the pointing-out instructions contain sentences that name four prayers to recite in turn, and one link per prayer is the point of the mechanism. A plain string remains legal and means exactly what it did; nothing on disk changed shape. (2) The deity manifest, deferred at Phase 0 ("full field spec arrives in Phase 4"), is now specified in §9. No existing field changed meaning.

Content lives in structured data; the renderer reads data and never interprets prose. One JSON file per text in `content/texts/<text-id>.json`, plus one cycle manifest at `content/cycle.json`. Everything is UTF-8.

A deliberate rule about the examples in this document: **every piece of textual content is the literal placeholder `TODO_CONTENT`.** I do not author, paraphrase, or approximate any Tibetan or English text, including in documentation (BRIEF §0.2). The examples show shape, not words. `TODO_CONTENT` is also the sanctioned marker for real gaps during content entry: it means "a human must supply this" and the validator counts and reports every one.

---

## 1. The text file

```jsonc
{
  "schemaVersion": 1,
  "id": "TODO-text-id",
  "cycle": "zab-chos-zhi-khro",
  "kind": "instruction",
  "title": {
    "bo": "TODO_CONTENT",
    "phon": "TODO_CONTENT",
    "en": "TODO_CONTENT"
  },
  "source": {
    "attribution": "TODO_CONTENT",
    "notes": null
  },
  "sections": [ /* §3 */ ]
}
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `schemaVersion` | integer | yes | Always `1` for now. Exists so a future migration is possible without guessing. |
| `id` | string | yes | Kebab-case, unique across the whole corpus, **stable forever** — ids are the anchors for resume-position, cross-references, and any future audio sync. Renaming an id after content ships is a breaking act; don't. |
| `cycle` | enum | yes | `"zab-chos-zhi-khro"`, `"dudjom-six-bardos"`, or `"app"`. Which body of material the text belongs to; `"app"` is for material belonging to the instrument itself (the Guide shelf), not to either textual cycle. *(Cycle names are my proposal — confirm or correct the second one especially.)* |
| `kind` | enum | yes | `"instruction"` \| `"liturgy"` \| `"prayer"` \| `"diagnostic"` \| `"phowa"` \| `"guide"` (BRIEF §6; `"guide"` added at the owner's Phase 3 direction). Drives grouping on the home screen, nothing else. |
| `title` | object | yes | `bo` and `phon` are string-or-null; `en` is a required non-empty string. The full honest title of the text — each text is first-class (BRIEF §4). |
| `source` | object | yes | `attribution` (string, required, `TODO_CONTENT` until you supply it) and `notes` (string or null). Provenance is apparatus; it renders as L4-style material, silently. |
| `sections` | array | yes, ≥1 | See §3. |

No other top-level fields are legal. The validator rejects unknown fields everywhere — a misspelled optional field should fail loudly, not vanish silently.

## 2. The cycle manifest — `content/cycle.json`

The home screen makes the shape of the cycle legible (BRIEF §4). That shape lives in exactly one place. *(Revised at the owner's Phase 3 direction: text entries became objects carrying `title` and `status`, so the whole cycle can be presented honestly — including texts whose translation is still forthcoming.)*

```jsonc
{
  "schemaVersion": 1,
  "groups": [
    {
      "id": "TODO-category-id",
      "heading": { "bo": null, "en": "TODO_CONTENT" },
      "texts": [
        { "id": "TODO-text-id", "title": "TODO_CONTENT", "status": "translated" },
        { "id": "TODO-other-text-id", "title": "TODO_CONTENT", "status": "forthcoming" }
      ]
    }
  ]
}
```

- `groups[]` is the display order; a group is a category of the cycle (a *bardo*, or a supplementary shelf). `texts` may be empty while a category awaits its catalogue.
- Each text entry: `id` (kebab-case), `title` (the English title as shown in navigation — the owner's words, `TODO_CONTENT` until supplied), `status` (`"translated"` \| `"forthcoming"`).
- `status` is enforced against the disk, both ways: a `translated` entry without `content/texts/<id>.json` is an error, and so is a `forthcoming` entry whose file already exists. Every text file on disk must appear exactly once, as `translated`.
- A `forthcoming` entry is metadata only — no content exists anywhere for it, and its id may still be renamed (ids freeze when content lands). The reader shows it locked.
- Texts are never merged or concatenated by the renderer — a group is a visual shelf, nothing more.

## 3. Sections

```jsonc
{
  "id": "s1",
  "heading": { "bo": "TODO_CONTENT", "en": "TODO_CONTENT" },
  "blocks": [ /* §4 */ ]
}
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Unique within the text, stable. Convention: `s1`, `s2`, … |
| `heading` | object | yes | `bo` string-or-null, `en` required non-empty. |
| `blocks` | array | yes, ≥1 | The content itself. |

## 4. Blocks

Every block carries exactly one `layer`. This is the spine (BRIEF §5).

```jsonc
{
  "id": "s1-b004",
  "layer": "L1",
  "form": "prose",
  "bo": "TODO_CONTENT",
  "phon": "TODO_CONTENT",
  "en": "TODO_CONTENT",
  "meter": null,
  "deityRef": null,
  "day": null,
  "refrain": false,
  "note": null
}
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Unique within the text, stable, utterance-grained. Convention: `<sectionId>-b<3-digit ordinal>` (`s1-b004`). Gaps after edits are fine; renumbering is not. |
| `layer` | enum | yes | `"L0"` \| `"L1"` \| `"L2"` \| `"L3"` \| `"L4"`. See §5. |
| `form` | enum | yes | `"prose"` \| `"verse"` \| `"title"` \| `"colophon"`. Verse renders line-broken and may carry `meter`. `title` and `colophon` are apparatus forms and legal only on L4. |
| `bo` | string \| null | yes (nullable) | Tibetan text. Multi-line verse: lines joined with `\n`. Subject to the shad-integrity check (§7.8). |
| `phon` | string \| null | yes (nullable); **non-empty on L3** | Phonetics. Line structure mirrors `bo` where both exist. Approved scope: phonetics belong to the liturgical layer — missing or empty `phon` on L3 is a validation error (a declared gap is `"TODO_CONTENT"`); on every other layer `phon` may be null. |
| `en` | string \| null | yes; **non-empty on L1/L2/L3** | English. The read-aloud layers must never render empty — an empty spoken block is a validation error; a known gap is `"TODO_CONTENT"`. |
| `meter` | integer \| null | yes (nullable) | Syllables per line, for metered verse (e.g. `7`, `9`). Only legal when `form` is `"verse"`. Null when unknown — never guessed. |
| `deityRef` | string \| null | yes (nullable) | Id of a deity in `assets/deities/MANIFEST.json`. A ref to a manifest id that doesn't exist is an error ("orphaned deityRef"). |
| `day` | integer \| null | yes (nullable) | Day 1–14 of the *bardo* of *dharmatā* sequence, where applicable. |
| `refrain` | boolean | no (default `false`) | Marks a repeated formula. Consecutive `refrain` blocks group into one framed panel and receive the auto-scroll hold (a mechanism inherited from the Ngondro reference — audit §1). Orthogonal to `layer`. |
| `boEndsOpen` | boolean | no (default `false`) | Declares that this block's Tibetan legitimately ends without a closing mark, exempting it from the shad-integrity check (§7.8). Only legal when `bo` is non-null. |
| `prayerRef` | string \| string[] \| null | no (default `null`) | Cross-link: the text id of a prayer in the cycle that this block mentions — or, since the Phase 4 amendment, an array of ids where one passage names several ("recite the Aspiration…; then chant the Root Verses…"). The reader renders one tappable link per id, in the order given, each jumping to that prayer. Every id must appear in `content/cycle.json` — a ref to an unlisted id is an error ("orphaned prayerRef"); a ref to a text outside the Prayers & Liturgies shelf is a warning; an empty array or a repeated id is an error. The owner decides which blocks carry refs and in what order; tooling never infers one. |
| `pl` | string \| null | no (default `null`) | Polish translation of the block, mirroring `en`'s line structure where both exist. **Entirely optional on every layer** — no layer requires it, and its absence is never an error or a warning. The renderer does not display it yet; the field exists so the corpus can carry Polish ahead of the interface (owner's Phase 3 direction). |
| `note` | string \| null | yes (nullable) | Your note on the block. Apparatus in spirit: rendered quietly in Guide mode only, never in Voice mode, never spoken. |

The ten core keys (`id`, `layer`, `form`, `bo`, `phon`, `en`, `meter`, `deityRef`, `day`, `note`) are written explicitly in every block, nullable ones as `null`; `refrain` and `boEndsOpen` may be omitted when false, and `prayerRef` and `pl` may be omitted when null (so their arrival does not churn every existing file). Verbose, but it makes bulk entry by a cheaper model mechanically checkable — a missing key is a contract violation, not a style choice.

Inline tokens inside `bo`/`phon`/`en`/`pl` strings — the only four the renderer recognizes; content is never parsed as HTML:

- `\n` — verse line break;
- `TODO_CONTENT` — a declared gap (rendered visibly, counted by the validator);
- `**…**` — emphasis on a span within the text (rendered bold in a color leaning toward the accent). Markers come in pairs; the words between them are still the owner's words, never edited when adding emphasis.
- `[[words|deity-id]]` — a deity's name where the text already names it (Phase 4 amendment). Words first, so the sentence still reads in the file. The reader renders the words exactly, as a tap that shows that deity's figure over the page; where the manifest holds no image for that id, the words render as the plain text they always were. The id must exist in `assets/deities/MANIFEST.json` — an unresolvable one is an error, as is a stray `[[` or `]]`. **Placing these marks is the owner's decision and they wrap text that is already present; nothing is ever added, reworded, or inferred by tooling.**

## 5. The layers, restated as data rules

The definitions are yours (BRIEF §5); these are the *data* consequences:

| layer | Name | Data consequences |
|---|---|---|
| `L0` | Rubric | Never spoken. `phon` should be null (warning if present — rubric is not recited; the renderer refuses to show it regardless). Shown in Guide mode; collapses to a thin marker in Voice mode. |
| `L1` | Address | Spoken. `en` must be non-empty. `phon` optional. The core read-aloud layer. |
| `L2` | Bardo recitation | Spoken so the dead can take it up. `en` must be non-empty. `phon` optional. Typically `form: "verse"` with `meter` set — but that is content judgment, never inferred by tooling. |
| `L3` | Living liturgy | Spoken by the assembly. `en` **and** `phon` must be non-empty — phonetics belong to the liturgical layer (approved decision). |
| `L4` | Apparatus | Silent. Titles, colophons, attributions, your notes — `form` is `"title"` or `"colophon"` where those apply, and those two forms are legal only here. Shown in Guide mode; absent from Voice mode. |

Layer assignment of any ambiguous passage is **your decision alone** (BRIEF §11). Content entry that hits an ambiguous passage stops and asks; it does not guess a layer. `TODO_LAYER` is not a value — a block whose layer is genuinely undecided stays out of the file until you decide.

## 6. Worked examples — one per layer

Shape only; every text field is deliberately `TODO_CONTENT`.

**L0 — rubric** (stage direction; prose; nothing recited):

```jsonc
{ "id": "s2-b001", "layer": "L0", "form": "prose",
  "bo": "TODO_CONTENT", "phon": null, "en": "TODO_CONTENT",
  "meter": null, "deityRef": null, "day": null, "note": null }
```

**L1 — address** (spoken to the dying/dead person; here prose, with a deity reference and a day, as in the *dharmatā* sequence):

```jsonc
{ "id": "s3-b002", "layer": "L1", "form": "prose",
  "bo": "TODO_CONTENT", "phon": "TODO_CONTENT", "en": "TODO_CONTENT",
  "meter": null, "deityRef": "TODO-deity-id", "day": 3, "note": null }
```

**L2 — bardo recitation** (metered verse the deceased is to hold; four lines joined with `\n`; meter recorded, never invented):

```jsonc
{ "id": "s4-b010", "layer": "L2", "form": "verse",
  "bo": "TODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT",
  "phon": "TODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT",
  "en": "TODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT\nTODO_CONTENT",
  "meter": null, "deityRef": null, "day": null, "note": null }
```

**L3 — living liturgy** (performed by the living; a repeated formula, hence `refrain`):

```jsonc
{ "id": "s5-b003", "layer": "L3", "form": "verse",
  "bo": "TODO_CONTENT", "phon": "TODO_CONTENT", "en": "TODO_CONTENT",
  "meter": null, "deityRef": null, "day": null, "refrain": true, "note": null }
```

**L4 — apparatus** (a colophon; silent — an in-section subheading would be the same shape with `"form": "title"`):

```jsonc
{ "id": "s6-b001", "layer": "L4", "form": "colophon",
  "bo": "TODO_CONTENT", "phon": null, "en": "TODO_CONTENT",
  "meter": null, "deityRef": null, "day": null, "note": null }
```

## 7. The validator — `scripts/validate.mjs` (built in Phase 1, specified now)

Plain Node ≥18, **zero npm packages**, run as `node scripts/validate.mjs`. Wired into CI; also runnable locally with no setup. It fails loudly, listing every violation with file, block id, and rule — never just the first.

**Errors (exit 1):**

1. File is not valid JSON / not valid UTF-8.
2. Unknown `schemaVersion`.
3. Missing or unknown `layer` (BRIEF §6).
4. Missing or unknown `kind`, `cycle`, or `form`; `form` of `"title"` or `"colophon"` on any layer other than L4; `meter` present on a non-verse form; `day` outside 1–14; any type mismatch.
5. Unknown/extra field anywhere (strict contract — catches typos in bulk entry).
6. Empty or missing `en` on a spoken layer (L1/L2/L3), and empty or missing `phon` on L3. The string `"TODO_CONTENT"` is *not* an error — it is a declared gap, counted and reported (see below). An empty string is an undeclared gap and fails.
7. Orphaned `deityRef` — id absent from `assets/deities/MANIFEST.json`. Orphaned `prayerRef` — id absent from `content/cycle.json` (a cross-link must point at a text the cycle actually lists, translated or forthcoming); also an empty `prayerRef` array, or the same id named twice in one.
8. **Shad-integrity** (rule confirmed at Phase 0 sign-off): every non-null, non-`TODO_CONTENT` `bo` value must end with a Tibetan closing mark — `།` (U+0F0D), `༎` (U+0F0E), `༏` `༐` `༑` (U+0F0F–U+0F11), or `༔` (U+0F14) — unless the block carries `"boEndsOpen": true`. That flag is the deliberate escape for verses that legitimately end open: the validator never breaks on a declared case, and never guesses about an undeclared one. Blocks with no Tibetan are never flagged.
9. **The forbidden title** (BRIEF §2): a repo-wide scan of every text file — content, code, comments, docs, meta tags. The pattern is assembled at runtime from character fragments so the string itself appears nowhere in the repository, including inside the validator. The one permitted historical note, if you ever write it, gets an explicit allowlist entry for that file.
10. Duplicate text `id` across the corpus; duplicate section/block `id` within a text.
11. Cycle-manifest integrity: every text on disk in exactly one group; no dangling text ids.
12. Deity-manifest integrity (§9): unknown/missing field, non-kebab-case or duplicate id, unknown `class`, `day` outside 1–14, a `consort` that is not an id in the same manifest, and — for a declared `image` — a path outside `assets/deities/images/`, an unsupported extension, a file that is not on disk, or a missing `attribution`/`license`.
13. An inline deity token naming an id the manifest does not hold, or a malformed one (a `[[` or `]]` that is not part of a well-formed `[[words|deity-id]]`).

**Reported, non-fatal:**

- `TODO_CONTENT` census — count per file, per field, per layer, printed on every run so the state of the corpus is always visible. (CI stays green while content is incomplete; the gaps are declared, not hidden.)
- Iconography progress — how many deity records exist and how many carry an image, against the roster of 42 peaceful + 58 wrathful, printed on every run. An incomplete roster is never a failure.
- `phon` present on L0 (rubric is not recited).
- Non-NFC Unicode normalization in `bo` (warning; Tibetan input methods vary).
- `prayerRef` pointing at a text outside the Prayers & Liturgies shelf (legal, but usually a slip — the mechanism exists for prayers).
- More deities of a class than the roster holds (more than 42 peaceful or 58 wrathful).

## 8. What the schema deliberately does not preclude (BRIEF §4)

Parallel translations and commentary layers are out of scope for v1 and invisible in the UI. The door stays open structurally: a future `schemaVersion: 2` can add sibling fields to `en` (e.g. alternate translations keyed by translator) and a commentary block reference without touching `layer`, `id`, or document structure — nothing in v1 stores anything *as* the sole translation slot except the field name `en` itself. No v1 code path will assume `en` is the only possible rendering.

## 9. The deity manifest — `assets/deities/MANIFEST.json`

*(Specified at the owner's Phase 4 direction, 2026-08-06; deferred from Phase 0. The fields are BRIEF §7's list, plus `phon` — the app shows Tibetan, phonetics and English everywhere else, and a name that may be read aloud should not be the exception.)*

The roster of the peaceful and wrathful deities of the *bardo* of reality — 42 peaceful and 58 wrathful when complete. The pictures are the owner's to supply (BRIEF §7: nothing is scraped, downloaded, or generated). Records may land before their images, and images may land one at a time; an incomplete roster is normal and never a validation failure. **The app renders a plate only where a record carries an `image`**, so an empty roster is invisible at the reading surface.

```jsonc
{
  "schemaVersion": 1,
  "deities": [
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
      "image": null,
      "attribution": null,
      "license": null
    }
  ]
}
```

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Kebab-case (dots allowed), unique, **stable forever** — it is what a block's `deityRef` points at. |
| `bo` / `phon` / `sa` / `en` | string \| null | yes (nullable) | The deity's name: Tibetan, phonetics, Sanskrit, English. Copied from the owner's source; `TODO_CONTENT` for a gap, never transliterated or translated by whoever is typing. |
| `class` | enum | yes | `"peaceful"` \| `"wrathful"`. |
| `day` | integer \| null | yes (nullable) | Day 1–14, or null for the deities belonging to no single day (the Gaurīs, the Piśācīs, the gatekeepers, the Īśvarīs). |
| `family` / `direction` / `color` / `seed` | string \| null | yes (nullable) | Family, direction, colour, seed syllable — the owner's words. |
| `consort` | string \| null | yes (nullable) | Another `id` in this same manifest; a ref that does not resolve is an error. |
| `image` | string \| null | yes (nullable) | Repo-relative path under `assets/deities/images/` (`.webp`, `.png`, `.jpg`), or null. A declared image must exist on disk. |
| `attribution` / `license` | string \| null | yes (nullable) | Provenance. **Both are required once `image` is set** — an image without its provenance does not ship. |

No other fields are legal; every field is written, `null` where absent, exactly as in the text blocks. The drop-in procedure is `docs/deity-images.md`.
