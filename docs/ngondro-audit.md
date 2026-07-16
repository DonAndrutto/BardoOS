# KGK Ngondro — Phase 0 audit

**Status: Phase 0 deliverable. For review. No code has been written from this.**

## 0. Which repo is the reference

There are two Ngondro repos, and they are not the same app:

| Repo | What it is | Last commit |
|---|---|---|
| `DonAndrutto/Ngondro` | **The single-file app.** One `index.html`, 4,392 lines, vanilla JS, no build, no dependencies. This matches the brief's description ("my existing single-file liturgy app") and is the newer of the two. | 2026-06-13 14:17 |
| `DonAndrutto/KGK-Ngondro` | The AI Studio prototype: Vite + React 19 + TypeScript + Tailwind, with CDN import maps. An earlier iteration of the same design. | 2026-06-13 13:37 |

**This audit treats `DonAndrutto/Ngondro` (`index.html`) as the reference implementation.** Line numbers below refer to that file. Differences in the React prototype are noted where they matter. If you consider the React repo canonical instead, say so and I will re-audit — but the single-file app is the more evolved of the two (its scroll engine is rAF-based where the React one uses `setInterval`, and its pause constants are tuned differently).

File layout: CSS lines 12–1085, markup 1088–1211, script 1213–4390 — of which the content data (`TABS_DATA`) is lines 1264–3448, about half the file. That ratio is the core scaling problem for Bardo OS: content and instrument in one file.

---

## 1. Auto-scroll

### Mechanism (`index.html:3758–3890`)

A `requestAnimationFrame` loop with a time-delta engine — not a `setInterval`:

- Speed model: `pxPerSec = 20 + scrollSpeed * 18` (`autoScrollPxPerSec`, L3812). Speed setting runs 1–10, so **38–200 px/s**; default speed is 2 (≈56 px/s).
- Each frame computes `dt` from the rAF timestamp, **clamped to 100 ms** (L3862) so a backgrounded tab doesn't lurch forward on return.
- **Sub-pixel accumulator** (L3864–3870): fractional movement is accumulated and only whole pixels are passed to `window.scrollBy(..., behavior:'auto')`, with the remainder carried. Without this, slow speeds stall completely because browsers round fractional scrolls to zero. This is the single most important trick in the file.
- Stops automatically within 2 px of the document bottom (L3873).
- Speed changes (`changeSpeed`, ±1, clamped 1–10) take effect live because the loop reads state every frame. **There is no visible speed indicator** — a `.speed-dot` CSS class exists (L936) but no element uses it. The reader cannot see what speed they're on. (The React prototype's unused `SettingsPanel.tsx` showed "2x"; the component isn't imported.)

### Pause/resume on user touch (`index.html:3720–3756`)

- `touchmove` (passive listener) sets `userScrollPaused = true` **immediately** — the loop keeps running but moves nothing.
- `touchend`/`touchcancel` schedule resume after **500 ms** of quiet; `wheel` pauses and schedules resume in one step.
- On pause, `lastScrollTime` and the accumulator are zeroed, so resuming never jumps — the engine restarts its time base. Tilt-scroll's reference angle is also re-baselined here (L3738), which is a thoughtful detail.

### The repeated-passage ("refrain") pause (`index.html:3767–3809`)

- Consecutive blocks with `variant: 'repeated'` are wrapped at render time into a `.refrain-group` panel.
- When a panel's top crosses a trigger line at **40% of viewport height** (and is within a 220 px window below it, so panels already above the line on start never fire), scrolling **holds for 2,600 ms**, then eases back to full speed over **900 ms** with `easeOutCubic`.
- A visited set prevents re-triggering; a panel re-arms if it scrolls back below the viewport. A `refrain-active` class drives a gentle glow pulse during the hold.
- React prototype used different constants (4,000 ms hold, 1,500 ms ramp, trigger at 38%, plus a linear slowdown zone 160 px *before* arrival). The single-file version dropped the approach-slowdown; arguably a small loss of grace, but simpler.

### Tilt-to-scroll (`index.html:3892–3990`)

Device-orientation scrolling: reference angle captured on start, ±30° clamp, 0.5° deadzone, power-curve response (exponent 1.5), max 3.5 px/frame, low-pass smoothing (8% approach per frame), its own sub-pixel accumulator, iOS 13+ permission dance. Mutually exclusive with auto-scroll. Permission denial is reported via `alert()` (L3920) — jarring.

### Verdict

**Lift the engine verbatim.** rAF + dt-clamp + sub-pixel carry + touch-pause/500 ms-resume is exactly right and battle-tested. Two defects to fix in the port:

1. Dead code at L3851–3857: the `if (!lastScrollTime)` guard is duplicated; the second copy is unreachable except at rAF timestamp exactly 0. Harmless, but drop it.
2. No speed readout. Bardo needs "fine speed control" (BRIEF §9); fine control without feedback isn't control. Add a quiet numeric indicator.

The refrain pause is a lovely mechanism, but its Bardo use (if any) should be decided per-layer, not ported by reflex. Tilt-scroll: port as-is, it's optional and self-contained.

---

## 2. Day/night mode

### Mechanism (`index.html:3453–3463`, tokens 18–119)

- A `data-theme="dark"` attribute on `<html>`; every color lives in a CSS custom property that the `[data-theme="dark"]` block overrides. Clean, framework-free, instant.
- Stored as boolean `isDark` inside the one localStorage JSON blob (key `kgk-ngondro-settings`).
- **Does not respect `prefers-color-scheme`.** Default is light; the reader must find the toggle. (React prototype: same, via Tailwind's `dark` class.)
- All theme-affected properties transition over 320 ms.

### Exact tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FDFBF7` (warm parchment) | `#1C1917` (warm near-black) |
| `--bg-secondary` | `#f5f0ea` | `#292524` |
| `--text` | `#1c1917` | `#e7e5e4` |
| `--text-muted` | `#78716c` | `#b6b1ab` |
| `--text-light` | `#a8a29e` | `#78716c` |
| `--accent` | `#8B0000` (deep red) | `#FF9933` (saffron) |
| `--accent-glow` | `#FF9933` | — |
| `--border` | `#e7e5e4` | `#44403c` |
| `--card` | `#ffffff` | `#292524` |
| `--instruction` | `#78716c` | `#a8a29e` |
| `--recitation` | `#1c1917` | `#e7e5e4` |
| `--recitation-repeated` | `#5D4037` | `#D7CCC8` |
| `--phonetics` | `#44403c` | `#ece8e2` |
| `--bar-bg` / `--glass-bg` | `rgba(253,251,247,0.72)` | `rgba(28,25,23,0.65)` |
| `--refrain-bg` | `rgba(139,0,0,0.035)` | `rgba(255,153,51,0.06)` |

The accent *swap* (red in light, saffron in dark) is the palette's signature and worth keeping.

### Verdict

**Keep the mechanism verbatim** (attribute + custom properties + single stored flag). Two changes for Bardo:

1. Respect `prefers-color-scheme` on first run, then let the manual choice win — the 3 a.m. reader should not open a white screen in a dark room.
2. The dark theme is an *inversion*, not a *dim* theme. `--text: #e7e5e4` on `#1C1917` is ~12.4:1 contrast — bright enough to light a face in a dark room. Bardo's night mode needs lower luminance (see the palette proposal). Also, low-alpha washes like `rgba(255,153,51,0.06)` effectively vanish at 20% screen brightness — which is exactly why Bardo's layer encoding cannot lean on washes alone.

---

## 3. Text-size control

### Mechanism (`index.html:3489–3493`, applied 3617–3626)

- Range **12–40 px** in **2 px steps** (buttons pass ±1, multiplied by 2), default **16 px**. Stored as `fontSize`.
- Applied as inline styles at render time, with fixed multipliers: Tibetan `×1.5`, phonetics `×0.9`, English `×1.0`, instruction-Tibetan `×1.2`. Titles use CSS `em` sizing so they scale with the block.
- Changing size **re-renders the whole content area via `innerHTML`** and makes no attempt to keep the reading position: the pixel scroll offset survives but the text reflows, so the reader lands somewhere else in the liturgy. Notably, `toggleFullScreen` (L4004–4023) *does* solve this — it measures an anchor block's `getBoundingClientRect().top` before the change and compensates after. The pattern exists in the file; it just isn't used for font-size or layer toggles.

### Verdict

Keep the multiplier model and the storage. For Bardo: raise the floor and the default (BRIEF §9 — the minimum "should be larger than you think"; propose min 16, default 19, max 48 — numbers to be approved with the palette), and **generalize the fullscreen anchor-compensation to every re-render** so no control ever loses the reader's place.

---

## 4. The Tibetan / phonetics / translation toggle

### State model (`index.html:3469–3483`)

- Three **independent booleans**: `showTibetan`, `showPhonetics`, `showTranslation` — all default `true`, all persisted. Any combination is legal, including all off (which renders section headings and nothing else — harmless but silly; worth a guard in Bardo).
- Three header buttons (TIB / PHO / ENG) with an `.active` state — border + accent color, not color alone.

### Markup model

The three layers are **fields on one block**, not parallel documents: `{ tibetan, phonetics, translation }`. A block renders up to three stacked divs — `.tib`, `.pho`, `.eng` — and a toggled-off layer is simply **not emitted** into the HTML (`renderBlock`, L3659–3713). Toggling re-renders everything via `innerHTML`, with the same lost-position defect as font-size changes.

Special cases: INSTRUCTION blocks never render phonetics even when PHO is on (rubric is not recited — this is the germ of Bardo's L0 rule); TITLE blocks show all three fields in their own type treatment.

### Verdict

The per-block field model is exactly right and carries directly into the Bardo schema (`bo` / `phon` / `en`). Keep the three independent booleans. Fix the re-render position loss. The "hidden = not emitted" approach (vs. CSS `display:none`) is also right — it keeps auto-scroll geometry honest, since hidden layers contribute no height.

---

## 5. Typography

### Font stack (`index.html:8–10`, 123–127)

| Role | Face | Notes |
|---|---|---|
| Tibetan | **Jomolhari** | The Tibetan face. OFL-licensed, so it can be vendored. |
| English / body | **EB Garamond** (400, 600, italic) | Base 17 px on the body; translations render at the user size. |
| UI, phonetics, labels | **Inter** (300–600) | Phonetics at weight 600; labels in small caps with wide tracking. |

**All three load from Google Fonts** (`fonts.googleapis.com`, L8–10). The React prototype is worse: Tailwind from CDN, React from `aistudiocdn.com` import maps. **Neither app works offline.** This is the single largest gap between the reference and Bardo's non-negotiables.

### Sizes, line-height, measure, rhythm

- Type tokens (L81–87): `--lh-tight: 1.25`, `--lh-snug: 1.45`, `--lh-body: 1.65`, **`--lh-tibetan: 1.85`** — the generous Tibetan line-height matters because Jomolhari stacks vowels and subjoined letters well below the baseline; anything tighter clips.
- Recitation: Tibetan `1.5×` user size, lh 1.85; phonetics Inter 600 at `0.9×` with `0.04em` tracking; English EB Garamond in `--text-muted`, lh 1.65.
- Measure: English capped at `max-width: 32rem`; the whole column at `56rem`; **everything is center-aligned** — every block, every layer.
- Rhythm: a 4 px spacing scale (`--sp-1`…`--sp-9`, L47–56) used consistently.
- Rendering hints: `font-feature-settings: "kern","liga","onum"` on body; `"ccmp","rclt"` + `optimizeLegibility` on `.tib` (L613–617) — keep these; `ccmp` matters for Tibetan shaping.

### Verdict

Keep the three-face stack and the Tibetan line-height/feature settings; **vendor all fonts locally** (all three are OFL — legal to self-host; Jomolhari is ~1 MB, which is acceptable cached-once, subsettable later). The all-centered layout is right for a liturgy the practitioner half-knows; it is *not* automatically right for Bardo's L1/L2 at arm's length — the palette proposal argues for left-aligned L1. That is a deliberate redesign, flagged there, not a silent one.

---

## 6. Everything else worth recording

- **State**: one localStorage JSON blob, key `kgk-ngondro-settings`, written on every change through a `try/catch` (private-mode-safe, L1256–1258). Persists: fontSize, isDark, the three layer booleans, activeTab, scrollSpeed, timer config. **Does not persist scroll position** — the app always reopens at the top. Bardo's "resume exactly where I was" has no precedent here; it must be built.
- **Block types** in data: `TITLE` (1), `HEADER` (2), `INSTRUCTION` (31), `RECITATION` (259), `NAVIGATION` (1), `IMAGE` (3), `TIMER` (4), plus `variant: 'repeated'` on 34 blocks. Mapping to the Bardo taxonomy: INSTRUCTION ≈ L0, RECITATION ≈ the spoken layers, TITLE/HEADER ≈ L4. NAVIGATION/TIMER/IMAGE are *app blocks* living inside text data — a modeling smell Bardo's schema avoids (navigation belongs to the cycle manifest; images become `deityRef`; timers are a practice feature with no v1 role in Bardo).
- **Rubric styling** (`.block-instruction`, L588–611): muted color, italic, Tibetan at 1.2× instead of 1.5×, opacity 0.9, no phonetics. Quiet and subordinate — the right instinct for L0, but the distinction leans on hue + italic + size only; there is no border/indent/glyph channel. Fine for a practitioner who knows the text; not enough for Bardo's rule of three (BRIEF §5).
- **Refrain panels** (L495–564): soft wash + 1 px border + rounded corners + centered small-caps label with an icon. The pattern generalizes: it proves a *framed panel with a label* reads clearly without shouting. The Bardo L2 treatment builds on it.
- **Index panel** (L3527–3604): overlay listing sections; jumping switches tab if needed and scrolls with a fixed 100 px header offset after a double-rAF wait for layout. Fine at this scale; Bardo's cycle navigation replaces it, and should compute the real header height (`measureStackHeight` already exists, L4054, and would have given the correct offset).
- **Images**: loaded from `raw.githubusercontent.com` (another offline violation); lazy-loaded, no viewer, no return-to-position concern because they're inline.
- **Fullscreen** (L3996–4032): hides the sticky stack, compensates scroll via anchor measurement, requests real `requestFullscreen`, and re-syncs on Escape. Port whole; this anchor trick is the seed of Bardo's general re-render position keeper.
- **Timers** (L4078–4363): four slots sharing one countdown budget (time spent in earlier slots subtracts from later), stopwatch mode, WebAudio three-tone chime, auto-pause on `visibilitychange`. Self-contained and well-made, but a *practice* feature. **Propose: not in Bardo v1.** Nothing in the deathbed use case wants a timer.
- **Animations**: block entrance fade+rise with 40 ms stagger (L1000–1013), refrain pulse/spin, spring-eased tab indicator. All respect `prefers-reduced-motion` (L1071–1083) — good discipline. **None of it ports**: BRIEF §9 forbids animation beyond the scroll itself. The reduced-motion block itself is the piece to keep.
- **Copy/right-click prevention** (L4047–4048) and `user-scalable=no` (L5): deliberate ("matches existing apps" per the code comment). Both hostile to accessibility; both your call for Bardo, flagged as an open question rather than silently kept or dropped.
- **Donate link** (header, L1102, PayPal): external navigation from the reading surface. Recommend it does not exist in Bardo at all — a deathbed instrument should have no commerce on it. Your call.
- **Security hygiene**: all content passes through `esc()` before `innerHTML` (L3715–3718). Keep the discipline.
- **No PWA**: no manifest, no service worker, no Wake Lock anywhere. All three are Bardo requirements to be built new.

---

## 7. Keep / fix / rebuild

### Lift verbatim (mechanism and, where possible, code)

1. Auto-scroll engine: rAF + dt clamp + sub-pixel carry + touch pause / 500 ms resume (minus the dead code).
2. Tilt-scroll engine, whole.
3. Theme mechanism: `data-theme` attribute + custom-property tokens; the warm palette as the base the layer palette extends.
4. Refrain-panel construction (as the starting point for L2's framed treatment).
5. Fullscreen anchor-compensation pattern — generalized to every re-render.
6. Type tokens: the three faces, `--lh-tibetan: 1.85`, Tibetan font-feature settings, the 4 px spacing scale.
7. `esc()` discipline, localStorage `try/catch` wrapper, `prefers-reduced-motion` block, `env(safe-area-inset-bottom)` handling in the bottom bar.
8. Bottom-bar layout concept: grouped glass clusters, one-handed, bottom third (BRIEF §9 asks exactly this).

### Bugs / gaps worth fixing in the port

1. **Offline violations**: Google Fonts CDN, GitHub-hosted images. Vendor everything.
2. **Lost reading position** on font-size or layer toggle (fix with the anchor pattern).
3. No scroll-position persistence at all (Bardo: resume exactly, across app death).
4. No wake lock, no service worker, no manifest.
5. No visible scroll-speed value; dead `.speed-dot` CSS.
6. Dead code: duplicated `!lastScrollTime` guard (L3851–3857); unused `SettingsPanel.tsx` in the React repo.
7. `alert()` for tilt permission denial — replace with a quiet inline notice.
8. Dark mode defaults to light and ignores the system; dark theme too bright for a dark room.
9. Index jump uses a hardcoded 100 px offset instead of the measured stack height.
10. All-off layer toggle state renders an empty page with no hint why.

### Single-file-specific; will not survive the port

1. **Content embedded in the app file** (half the file). Becomes external JSON per text, validated in CI — this is the whole point of the Bardo schema.
2. **String-concatenated `innerHTML` rendering with inline `onclick` attributes.** Manageable at one file; unmanageable across a multi-text cycle with a reference viewer. Becomes small vanilla render modules + event delegation. No framework required — the architecture doc argues this.
3. **Global mutable state** scattered across ~20 top-level `let`s. Becomes one namespaced store with explicit persistence.
4. **Two hardcoded tabs + hardcoded index links.** Becomes navigation derived from the cycle manifest.
5. **App blocks inside content data** (NAVIGATION/TIMER/IMAGE), as above.

Nothing here is a silent redesign: every departure from the reference is either a Bardo non-negotiable (offline, no animation, layer encoding) or listed above and awaiting your yes.
