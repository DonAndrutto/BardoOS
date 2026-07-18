# Entering a text into Bardo OS

This guide is for whoever types content into the repository — a person or a model. It assumes nothing except that you can edit files and run one command. The contract is `SCHEMA.md`; the enforcer is `scripts/validate.mjs`; this page is the walkthrough.

**The two absolute rules, before anything else:**

1. **You never author, improve, complete, paraphrase, or "fix" any Tibetan or English text.** You copy the author's source exactly, character for character — or, where the source has a gap, you write the literal string `TODO_CONTENT` and move on. A plausible-looking guess is worse than a gap. This includes titles, headings, and notes.
2. **You never decide the layer of an ambiguous passage.** The conventions below cover the clear cases. If a passage doesn't clearly match one, stop and ask the author. Do not guess; do not pick "the closest one." There is no `TODO` value for `layer` on purpose — an undecided block stays out of the file until the author decides.

## 1. Create the file

One text = one file: `content/texts/<text-id>.json`. The id is kebab-case, dots allowed (`bardo-thodrol.dying-intro`), and must equal the filename. Start by copying the shape of the existing sample (`content/texts/bardo-thodrol.dying-intro.json`) or this minimal skeleton:

```json
{
  "schemaVersion": 1,
  "id": "my-text-id",
  "cycle": "zab-chos-zhi-khro",
  "kind": "instruction",
  "title": { "bo": "TODO_CONTENT", "phon": null, "en": "TODO_CONTENT" },
  "source": { "attribution": "TODO_CONTENT", "notes": null },
  "sections": [
    {
      "id": "s1",
      "heading": { "bo": null, "en": "TODO_CONTENT" },
      "blocks": [
        {
          "id": "s1-b001",
          "layer": "L0",
          "form": "prose",
          "bo": "TODO_CONTENT",
          "phon": null,
          "en": "TODO_CONTENT",
          "meter": null,
          "deityRef": null,
          "day": null,
          "note": null
        }
      ]
    }
  ]
}
```

- `cycle`: `zab-chos-zhi-khro` or `dudjom-six-bardos` (`app` exists too, but only for the app's own Guide texts — you will not create those).
- `kind`: `instruction`, `liturgy`, `prayer`, `diagnostic`, `phowa`, or `guide` (same caveat).
- Every block writes all ten core keys, using `null` where a value is absent. `refrain` and `boEndsOpen` are added only when true.
- Two more optional keys exist, added only when they carry a value: `prayerRef` (a cross-link to a prayer — **the author decides where these go; never add one yourself**) and `pl` (the author's Polish translation, when supplied; mirror `en`'s line structure). Omit both otherwise.

## 2. Split the source into blocks

A block is one sense unit — one paragraph of prose, or one stanza of verse. In the author's bilingual documents, Tibetan sits directly above its English; that pair is **one** block (`bo` + `en`), not two.

- Verse: put each line in the same string, separated by `\n`. Set `"form": "verse"`. If the author states a syllable count, record it in `meter`; otherwise leave `meter: null` — never count syllables yourself.
- Prose: `"form": "prose"`, no `\n` needed.
- Section headings in the source become new `sections` entries, not blocks. Sub-headings *inside* a section become L4 blocks with `"form": "title"`.

## 3. Tag the layer

The author's source conventions, and what they mean here:

| You see in the source | Layer |
|---|---|
| Amber/gold shaded passage, gold left rule, marked `◆ READ ALOUD` | `L1` |
| Indented, metered verse (typically inside the shaded panels) | `L2` |
| Prayers/liturgy performed by the living assembly | `L3` |
| Everything unshaded: stage directions, explanations, "at this time do X" | `L0` |
| Title lines, attribution ("A treasure revealed by…"), colophons, the author's own notes | `L4` (`form`: `title` or `colophon` as fits) |

The `◆ READ ALOUD` marker line itself is **not** a block — the app renders that label from the layer tag. Drop it.

If a passage is shaded but reads like a stage direction, or unshaded but reads like speech — **stop and ask.** That mismatch is exactly the ambiguity rule 2 is about.

## 4. Copy the text — or declare the gap

- `bo`: the Tibetan, exactly as in the source. It must end with a closing mark (`།` `༎` `༏` `༐` `༑` `༔`). If the source genuinely ends a verse without one, add `"boEndsOpen": true` to that block — don't add a mark the source doesn't have.
- `en`: the English, exactly as in the source. Required (non-empty) on L1, L2, and L3.
- `phon`: phonetics, **required on L3 only** (use `TODO_CONTENT` if not yet supplied); `null` elsewhere unless the author provides them. Never invent a transliteration.
- Footnotes in the source: put `TODO_CONTENT` in that block's `note` field and tell the author — footnote text is theirs to place.
- Anything missing, illegible, or uncertain: `TODO_CONTENT`. The validator counts these and reports them; they are normal during entry.

## 5. Register the text in the cycle

Add the text to exactly one group in `content/cycle.json`. An entry is an object — id, the navigation title (the author's words), and status:

```json
{ "id": "group-1", "heading": { "bo": null, "en": "TODO_CONTENT" }, "texts": [
  { "id": "my-text-id", "title": "TODO_CONTENT", "status": "translated" }
] }
```

Every text on disk must appear in the manifest exactly once, as `"translated"`, or validation fails. (A `"forthcoming"` entry is the opposite case: catalogued, but no file on disk yet.)

## 6. Validate

From the repository root:

```
node scripts/validate.mjs
```

No installation, no packages — just Node 18 or newer. `OK — the contract holds` means done. Otherwise every violation is listed with its file, block, and rule. Common ones:

| Message | It means | Fix |
|---|---|---|
| `unknown field "…"` | Typo in a key, or an invented field | Match the skeleton exactly |
| `missing required field "…"` | A key was left out | Every block writes all ten core keys |
| `empty "en" on spoken layer` | An L1/L2/L3 block with no English | Copy the source, or `TODO_CONTENT` |
| `empty "phon" on L3` | Liturgy without phonetics | `TODO_CONTENT` until the author supplies them |
| `Tibetan does not end with a closing mark` | `bo` ends mid-stream | Check you copied the full passage; if the source truly ends open, `"boEndsOpen": true` |
| `orphaned deityRef` | A deity id not in `assets/deities/MANIFEST.json` | Leave `deityRef: null` unless the id exists |
| `orphaned prayerRef` | A cross-link to a text id not in `content/cycle.json` | Refs are the author's to place; ask before touching one |
| `dangling text id` / `not in the cycle manifest` | File and `cycle.json` disagree | Step 5 |
| `duplicate block id` | Two blocks share an id | Ids are `s<n>-b<3 digits>`, unique per text |
| `contains the forbidden title` | The one string that never appears in this project | Remove it. The work is the *Bardo Thödröl*. |

The same validator runs in CI on every push, so nothing broken can land quietly.

## 7. What you never do

- Never renumber existing block ids — they anchor reading positions, cross-references, and future audio. New blocks between old ones get fresh ids; gaps are fine.
- Never touch `SCHEMA.md` — it is frozen. If the contract seems wrong, tell the author.
- Never translate, transliterate, summarize, or embellish. `TODO_CONTENT` and a question beats initiative every time.

## 8. Bump the offline cache version

If you changed any content, open `sw.js` and bump the `VERSION` string (`bardo-os-v2` → `bardo-os-v3`). Readers' devices keep serving their cached copy until this changes. It is one line, and forgetting it is the only way to ship an update nobody receives.
