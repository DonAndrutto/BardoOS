# Layer palette proposal — L0–L4

**Status: Phase 0 proposal, for approval before anything is built (BRIEF §5). Numbers are computed WCAG contrast ratios, not vibes.**

## 1. Principles

1. **Never color alone** (BRIEF §5). Every layer differs from every other layer in **at least three** of: hue, left-border treatment, indentation/alignment, glyph/label, type treatment. The matrix in §4 makes this checkable.
2. **Structure survives dimness; washes don't.** At 20% screen brightness a low-alpha background tint is nearly invisible. So washes are always the *fourth or fifth* cue, never load-bearing; borders, alignment, glyphs, and type carry the layer identity.
3. **Dim, not inverted.** Night mode lowers total emitted light. The reference app's dark text sits at 13.9:1 contrast — bright enough to light a face. Proposed night text sits at ~11:1 on a deeper ground: still far above the 7:1 AAA line, noticeably quieter in a dark room.
4. **The base is the Ngondro palette** (audit §2): warm parchment, deep red, saffron; the red↔saffron accent swap between modes is kept. Bardo extends it with layer tokens; it does not replace it.

## 2. Base tokens

| Token | Day | Night (dim) | Notes |
|---|---|---|---|
| `--bg` | `#FDFBF7` | `#171412` | Night is deeper than Ngondro's `#1C1917`. |
| `--text` | `#1c1917` (16.9:1) | `#cfc8bf` (11.1:1) | Night deliberately below Ngondro's `#e7e5e4` (13.9:1). |
| `--text-muted` | `#78716c` (4.6:1) | `#8f867c` (5.1:1) | Floor-checked: anything darker than ~`#8f867c` on night bg drops under 4:1. |
| `--accent` | `#8B0000` (9.7:1) | `#FF9933` (8.6:1) | The swap, kept. |
| `--gold` | `#B8860B` | `#FF9933` | L1's rule color (see below). |
| `--phonetics` | `#44403c` (9.9:1) | `#c4bcb1` (9.8:1) | |
| `--border` | `#e7e5e4` | `#3a342e` | |

Type faces and Tibetan settings come from the audit unchanged: Jomolhari (`--lh-tibetan: 1.85`, `ccmp`/`rclt`), EB Garamond, Inter — all vendored.

## 3. The five layers

### L0 — Rubric (quiet, recessive, never spoken)

- **Hue**: `--text-muted` only — never full text color.
- **Border**: none.
- **Alignment/measure**: centered, on a narrower measure (24rem vs the spoken layers' 32rem) — it reads as marginal, physically.
- **Glyph/label**: none in Guide mode. It is the *absence* layer.
- **Type**: EB Garamond *italic* at **0.85×** the user size; Tibetan (when shown) at 1.2× instead of 1.5×; **no phonetics ever** (schema rule).
- **Voice mode**: the whole block collapses to a thin centered marker — a 2rem hairline in `--border` color with a small dot — occupying one quiet line. Tapping it peeks the rubric in place (expands inline, tap again to collapse); the reading position does not move. The marker is identical for every rubric: at 3 a.m. it means exactly one thing — "something for you, not to be read out; ignore unless you need it."

### L1 — Address (unmistakable at arm's length)

The layer the app exists for. Your Word convention — `◆ READ ALOUD`, amber shading, gold left rule — is preserved in semantics and strengthened in structure:

- **Hue**: full `--text` at full size — the darkest, largest text on the page.
- **Border**: **3px solid gold left rule** (`--gold`; day `#B8860B`, night `#FF9933`) running the full height of the block group.
- **Background**: amber wash — day `rgba(232,158,39,0.08)` (≈`#fbf4e6` over parchment; text on it 16.0:1), night `rgba(255,153,51,0.10)` (≈`#2e2115`; text 9.4:1). The wash is reinforcement only — at 20% brightness the rule, alignment, and glyph still identify the layer unaided.
- **Alignment**: **left-aligned** with generous left padding. Everything else on the page is centered; L1 alone is set like speech to be delivered. This is the strongest single cue and it is hue-free. *(This is a deliberate departure from the all-centered reference — flagged, not silent.)*
- **Glyph/label**: `◆` plus the small-caps label **READ ALOUD** (your term, kept verbatim) at the start of each contiguous L1 run — labeling runs, not every block, so a long address doesn't nag.
- **Type**: upright serif; English at **1.0× user size, minimum enforced high** (proposal: L1 never renders below 19px regardless of the global setting).

### L2 — Bardo recitation (metered; to be taken up by the deceased)

- **Hue**: deep warm brown — day `#5D4037` (8.5:1 on its panel), night `#D7CCC8` (10.8:1) — the reference app's "repeated formula" color, inherited.
- **Border/frame**: a **full soft panel** — 1px border all round, rounded corners, faint wash (day `rgba(139,0,0,0.03)`, night `rgba(255,153,51,0.05)`) — the Ngondro refrain construction. A panel (enclosure) reads differently from L1's rule (margin) even in monochrome.
- **Alignment**: verse lines set line-broken with a hanging indent, left-aligned *inside* the centered panel.
- **Glyph/label**: small-caps label at panel top. Default wording: **BARDO RECITATION** — your layer name from the brief. *(Label wording is terminology; confirm or replace — see §6.)*
- **Type**: verse always; `meter` shown nowhere in v1 (it's data, not decoration).

### L3 — Living liturgy (the assembly's prayers)

- Rendered exactly as the reference app renders liturgy — this *is* the Ngondro presentation, inherited whole: **centered**, full `--text`, phonetics line above translation, no wash, no border, no glyph.
- **Label**: a small-caps run-label at the start of each contiguous L3 run. Default wording: **LITURGY** *(confirm or replace — §6)*.
- Distinct from L1 by alignment + border + wash + glyph (4 channels); from L2 by panel + hue + indentation (3); from L0 by type + hue + size (3).
- `refrain: true` L3 blocks additionally get the framed repeat panel and the auto-scroll hold, as in the reference.

### L4 — Apparatus (silent; titles, colophons, attribution, your notes)

- **Titles**: the reference app's title treatment — Tibetan in accent color, phonetics in wide-tracked Inter caps, English italic muted, centered.
- **Colophons/attribution/notes**: EB Garamond italic, `--text-muted`, 0.85×, centered, set off by a hairline top rule (a cue no other layer uses).
- **Type**: the only layer using Inter caps headings — the sans face itself is a channel.
- **Voice mode**: absent entirely (with the text's title kept once at the top for orientation).

## 4. The distinguisher matrix

Five channels; every pair of layers differs in ≥3. ● = has it, — = doesn't.

| Channel | L0 | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|
| Hue | muted | full | brown | full | accent/muted |
| Left border / frame | — | ● 3px gold rule | ● full panel | — | hairline top rule |
| Alignment / indent | center, narrow | **left** | verse-in-panel | center | center |
| Glyph / label | — (marker in Voice) | ◆ READ ALOUD | panel label | run label | — |
| Type | italic 0.85× | upright 1.0× large | verse, brown | upright + phonetics | caps/italic small |

Worst pair is L3 vs L0 at exactly 3 (hue, type, measure) — acceptable because they also never adjoin ambiguously: rubric before liturgy is the classic sequence, and the size difference is large.

**Colorblindness**: no distinction anywhere rests on red-vs-gold. Deuteranopia collapses `--accent` and `--gold` toward similar tones — and loses nothing, because L1/L2/L3 are separated by alignment, panel-vs-rule, and glyphs.

**20% brightness test** (the real condition): washes effectively vanish; what remains per layer — L0: italic + small + centered-narrow; L1: left alignment + 3px rule + ◆; L2: panel outline + verse shape; L3: centered + phonetics stack; L4: caps/italic small. Every layer survives on structure alone. This is the design's actual safety margin, and it is why I will not propose stronger washes to compensate — brighter washes at full brightness would make L0/L1 compete, which BRIEF §5 forbids.

## 5. Voice mode, one paragraph

Same page, same scroll engine, one flag: L0 → thin peekable marker; L4 → gone (title kept once); L1/L2/L3 render with the base size stepped up (proposal: +3px over the user's Guide-mode size, floor 20px) at a wider measure. The bottom bar keeps only: slower / play-pause / faster, Voice toggle, night toggle, text size. Reachable in one tap from anywhere; leaves you exactly where you were when toggled back — block-anchored, like every other re-render (audit §3).

## 6. Decisions I need from you

1. **Approve or adjust the night-mode dimming** — text `#cfc8bf` on `#171412` (11:1). I can go dimmer (e.g. 8:1) if you test at 20% brightness and want less light; the floor check says don't go below ~5:1 for muted text.
2. **L1 label**: keeping your `◆ READ ALOUD` verbatim. Confirm.
3. **L2 / L3 label wording**: defaults **BARDO RECITATION** / **LITURGY** are lifted from your own layer names in the brief, but they are user-facing terminology and therefore yours. Confirm or give me the words.
4. **L1 left-alignment** (the one deliberate departure from the all-centered reference). Confirm.
5. **Text-size bounds**: min 16 / default 19 / max 48; L1 floor 19; Voice floor 20. Adjust freely.
