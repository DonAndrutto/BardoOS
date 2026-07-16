# Bardo OS — Build Brief for Claude Code

> Paste this whole file as your opening message in Claude Code (or drop it in the repo as `BRIEF.md` and say "read BRIEF.md and start at Phase 0").

---

## 0. Rules of engagement — read before touching anything

1. **Do not write application code until Phase 0 is approved by me.** Phase 0 is investigation and a written architecture proposal. Nothing else.
2. **You do not author scripture.** You will never write, paraphrase, summarize, "improve," complete, or fill gaps in any Tibetan or English text in this project. Not even a placeholder verse that looks plausible. If content is missing, emit `"TODO_CONTENT"` and tell me. Your job is the instrument; the text is mine.
3. **Ask before**: creating a new repo, adding any dependency, adding any network call, restructuring the data schema after it's frozen, or making a doctrinal/terminological decision.
4. **Work in small, reviewable commits** with real messages. No 4,000-line drops.
5. When you're unsure whether something is a code decision or a Dharma decision, it's a Dharma decision. Ask.

---

## 1. What this is

**Bardo OS** — an offline-first reading instrument for guiding a person through dying and the *bardo* states.

It is not a book app and not a study tool. Picture the actual user: someone sitting beside a body at 3 a.m., possibly not a practitioner, possibly frightened, holding a phone in one hand, needing to know *exactly which words to say out loud right now*. Every design decision is answerable to that moment. If a feature doesn't serve it, it doesn't ship in v1.

The corpus is the *Zab chos zhi khro dgongs pa rang grol* cycle of Karma Lingpa, plus Dudjom Rinpoche's Six Bardos material.

---

## 2. Non-negotiables

- **The title.** The work is ***The Great Liberation Upon Hearing in the Intermediate State*** (བར་དོ་ཐོས་གྲོལ་ཆེན་མོ), short form ***Bardo Thödröl***. The string "Tibetan Book of the Dead" appears nowhere in the app, the code, the comments, the README, or the meta tags — except possibly in one historical note explaining why it is wrong. Add a CI/lint check for this string.
- **Offline, absolutely.** No CDN, no Google Fonts, no analytics, no telemetry, no runtime fetch of anything. The app must work in airplane mode, in a hospice basement, forever. Fonts vendored locally. If you propose a dependency that phones home, you have misread this brief.
- **Read-aloud text is never blurred with rubric.** This is the single biggest failure of existing editions and the app's core reason to exist. See §5.
- **Register.** Everything user-facing — UI labels, section titles, tooltips — is plain, direct, spoken English. No academic diction, no "Alas," no ornament. Follow my `interpreter-assistant` skill and the project glossary. Do not re-propose settled terms (*clear light*, *rigpa*, *primal awareness*, *pointing-out* not "introduction", *Child of the Noble Family*, etc.).
- **No dark patterns of any kind.** No streaks, no gamification, no "share." This is a deathbed.

---

## 3. Reference implementation — read this first

**`github.com/DonAndrutto/KGKNgondro`** is my existing single-file liturgy app. Its look and feel are already correct and are to be **replicated exactly**, not reinterpreted.

Phase 0 deliverable: `docs/ngondro-audit.md` — a written audit covering:

- The auto-scroll implementation: mechanism, speed control, pause/resume, how it handles user touch interruption.
- Day/night mode: exact tokens, how the switch is stored, whether it respects system preference.
- Text-size control: range, increments, storage.
- The Tibetan / phonetics / translation toggle: state model, how the three layers are marked up, what happens on toggle.
- Typography: exact font stack (esp. the Tibetan face), sizes, line-height, measure, vertical rhythm.
- What is worth keeping as-is, what has bugs worth fixing, and what is single-file-specific and won't survive the port.

Then tell me, in that doc, which parts you intend to lift verbatim and which you intend to rebuild. **Do not silently redesign my app.**

---

## 4. Corpus scope

The cycle is many distinct texts, and current editions flatten them into one undifferentiated "book." Bardo OS must present the structure honestly:

- Instructions for the *bardo* of dying, the *bardo* of *dharmatā*, the *bardo* of becoming
- Liturgies and rituals
- Examination of the signs of death (*'chi ltas*)
- Guidance for the dissolution of the elements
- *Phowa*
- Aspiration prayers of the *bardos* (Calling on the Buddhas for Aid; Protection from Fear; Deliverance from the Perilous Straits; Root Verses of the Six Bardos)

Each is a **first-class, separately addressable text** with its own identity, title, and place in the cycle. Never merged, never silently concatenated. The home screen should make the shape of the cycle legible at a glance.

**Explicitly out of scope for v1:** parallel translations; commentary layers. The data model must not *preclude* them later. The UI must not hint at them now.

---

## 5. The layer taxonomy — this is the heart of the project

Every block of content carries exactly one `layer` tag. This is the app's spine.

| id | Layer | Who speaks it | To whom |
|---|---|---|---|
| `L0` | **Rubric** — instructions to the reader, stage directions, "at this time do X" | nobody | nobody — **never spoken** |
| `L1` | **Address** — words spoken directly *to* the dying/dead person: pointing-out, explanation, description of what is happening to them | the reader, aloud | the dying/dead |
| `L2` | **Bardo recitation** — words the deceased is told to say or remember *themselves*, in the bardo; typically metered so they can be held in mind | read aloud *so the deceased can take them up* | the deceased repeats them |
| `L3` | **Living liturgy** — prayers and aspirations performed *by the living for the sake of the dead*, apart from the pointing-out | the assembly | buddhas, deities |
| `L4` | **Apparatus** — titles, colophons, my notes, source attribution | nobody | the reader, silently |

My existing convention in the Word drafts: `◆ READ ALOUD` + amber shading + gold left rule marks L1; indented metered verse marks L2. Preserve the semantics; you may improve the rendering.

### Visual encoding rules

- **Never color alone.** Every layer is distinguished by *at least three* of: hue, left border treatment, indentation, icon/glyph, type treatment. A reader under stress, at 3 a.m., at low screen brightness, possibly colorblind, must never have to think about which layer they're in.
- Must hold up in **both** light and dark mode. Test dark mode at 20% brightness — that's the real condition.
- L0 must be visually *quiet and recessive* — clearly subordinate, never competing with L1 for the eye.
- L1 must be unmistakable at arm's length, glanced at sideways.
- Propose the palette in Phase 0 with rationale. I'll approve it before you build.

### Voice Mode (build this)

Two reading modes, toggled:

- **Guide mode** — everything, in document order. For preparing, learning, orienting.
- **Voice mode** — L0 collapses to a thin unobtrusive marker; only the spoken layers (L1/L2/L3) show, in sequence, at large type, with auto-scroll. This is *the mode you use when someone is dying*. It should be reachable in one tap from anywhere.

If Voice mode works, the app has succeeded. Design it first, not last.

---

## 6. Data model

Content lives in structured data, **not** in markup. The renderer reads data. This is what makes the layer tagging, the toggles, and search possible — and it's what lets me delegate content entry.

Sketch (refine it and propose the final in Phase 0):

```jsonc
{
  "id": "bardo-thodrol.part-1",
  "title": { "bo": "…", "phon": "…", "en": "The Great Liberation Upon Hearing…" },
  "cycle": "zab-chos-zhi-khro",
  "kind": "instruction | liturgy | prayer | diagnostic | phowa",
  "sections": [
    {
      "id": "…",
      "heading": { "bo": "…", "en": "…" },
      "blocks": [
        {
          "id": "…",
          "layer": "L0 | L1 | L2 | L3 | L4",
          "form": "prose | verse",
          "bo": "…",
          "phon": "…",
          "en": "…",
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

Also deliver:

- `SCHEMA.md` — human-readable spec of every field, with worked examples of each layer.
- `scripts/validate.mjs` — a validator that fails loudly on: missing `layer`, unknown layer, empty `en` on a spoken layer, orphaned `deityRef`, the forbidden title string, and any Tibetan block missing its `᭼`/shad-integrity check. Wire it into CI.

The schema is the contract. Once I approve it, it's frozen without asking.

---

## 7. Iconography

The *bardo* of *dharmatā* deities must be reference-accessible: tap a day, see who appears; tap a name in the text, see the image.

- Build `assets/deities/MANIFEST.json`: id, Tibetan name, Sanskrit name, English, day (1–14), family, peaceful/wrathful, consort, direction, color, seed syllable, `image` path, `attribution`, `license`.
- **Do not scrape or download images.** Do not generate images. Build the manifest, the data model, the lookup UI, and a clean placeholder state. I will supply the assets and their provenance.
- The image viewer must not hijack the reading position. Return the reader exactly where they were.

---

## 8. Architecture — propose, don't assume

My prior, which you may argue against: **a static, no-build (or trivial-build) site — vanilla JS or Preact, content as JSON, deployable to GitHub Pages, installable as a PWA for true offline use.** The single-file approach that works for KGK Ngondro will not scale to a multi-text cycle with iconography and cross-references; but I want to keep its virtues — zero infrastructure, editable by hand, no framework churn, still readable in five years.

Phase 0 deliverable: `docs/architecture.md` with **2–3 real options**, each with honest tradeoffs against these criteria, ranked, with a recommendation:

- Works offline, permanently, with zero services
- Content editable by a non-programmer (me) and by another model (see §11)
- Survives five years of neglect without a dependency rot event
- Loads instantly on an old phone on a hospice wifi
- Deployable to GitHub Pages from the repo, no CI mystery
- Does not require me to learn a build system to fix a typo

Then stop and wait for me.

---

## 9. Context-of-use constraints

Treat these as functional requirements, not polish:

- **Screen must not sleep** while reading (Wake Lock; graceful fallback).
- **Resume exactly where I was** — across app close, phone death, everything.
- **No destructive gestures.** Nothing that can lose the reader's place with a stray thumb. No swipe-to-navigate near the reading surface.
- **One-handed.** All controls in the bottom third.
- **No animation** beyond the scroll itself. Nothing that pulses, fades, or attracts the eye.
- **Auto-scroll**: fine speed control, instant pause on touch, resume without jump.
- **Minimum text size** should be larger than you think; maximum should be genuinely large.
- Night mode should be *dim*, not merely inverted — usable in a dark room without lighting up the whole space.

---

## 10. Phases and gates

- **Phase 0 — Investigate.** Read KGKNgondro. Deliver `docs/ngondro-audit.md`, `docs/architecture.md`, draft `SCHEMA.md`, the layer palette proposal. **Stop. Wait for approval.**
- **Phase 1 — Skeleton.** Repo, schema, validator, CI, one sample text hand-tagged end to end. Prove the pipeline. Stop.
- **Phase 2 — Reader.** The reading surface: layers, Guide/Voice modes, auto-scroll, day/night, text size, bo/phon/en toggle. Ported faithfully from Ngondro. Stop.
- **Phase 3 — Cycle.** Navigation across the texts; the shape of the cycle made legible. Stop.
- **Phase 4 — Iconography.** Manifest, lookup, placeholders.
- **Phase 5 — Hardening.** PWA/offline, wake lock, resume, low-brightness dark test, old-phone test.

---

## 11. Delegation boundary

I intend to hand routine work to a cheaper model. Your Phase 1 job is to make that possible: the schema, the validator, and a short `docs/content-entry.md` written so another model can do bulk data entry against a strict contract and have its output mechanically checked.

**Delegatable:** bulk JSON entry from my source documents, phonetic transliteration passes, mechanical cleanup, manifest population, test fixtures.
**Not delegatable, and not yours either:** layer tagging of ambiguous passages, any translation, any terminology choice, anything doctrinal. Those come to me.

---

## 12. Ask me these before you start

1. New repo `DonAndrutto/BardoOS`, or a branch off something existing?
2. How much of the corpus is already digitized, and in what form — do you need an ingestion path from `.docx`?
3. Do I want phonetics for *all* texts or only the liturgical ones?
4. Is there an audio dimension in the future I should not paint over?

Start with Phase 0. Read the Ngondro repo first.
