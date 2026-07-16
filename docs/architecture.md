# Bardo OS — architecture proposal (Phase 0)

**Status: proposal, for approval. Nothing is built. Phase 1 does not start until you approve one option here, the draft schema, and the palette.**

## 1. The criteria (from BRIEF §8)

1. Works offline, permanently, with zero services
2. Content editable by a non-programmer and by a cheaper model
3. Survives five years of neglect without a dependency rot event
4. Loads instantly on an old phone on hospice wifi
5. Deployable to GitHub Pages from the repo, no CI mystery
6. Fixing a typo must not require learning a build system

Plus the context-of-use requirements (BRIEF §9) that any option must carry: wake lock, exact resume, no destructive gestures, one-handed controls, no animation, fine auto-scroll, dim night mode.

---

## 2. Option A — no-build static site: vanilla ES modules + JSON content + PWA

**The shape.** A static repo, served as-is by GitHub Pages:

```
/index.html              app shell (small — no content in it)
/css/tokens.css          the palette & type tokens (from the audit + palette doc)
/css/app.css
/js/                     small vanilla ES modules: store, render, scroll, wake, nav
/content/cycle.json      the shape of the cycle: ordered text ids, groupings
/content/texts/*.json    one file per text (the schema)
/assets/fonts/           Jomolhari, EB Garamond, Inter — vendored, OFL
/assets/deities/         MANIFEST.json + images you supply (Phase 4)
/sw.js                   service worker: precache everything, cache-first
/manifest.webmanifest    installable PWA
/scripts/validate.mjs    the validator — plain Node, zero npm packages
/.github/workflows/ci.yml  runs the validator + forbidden-string lint. Nothing else.
```

There is **no build step, no `package.json`, no `node_modules`**. What is in the repo is what ships. The validator is a check, not a compiler — deleting `.github/` entirely would not change what deploys.

**Against the criteria:**

1. *Offline:* the service worker precaches the shell, all JSON, fonts, and images on first visit; after that the app works in airplane mode indefinitely, and is installable to the home screen. No runtime fetch leaves the origin — a CI grep enforces that no `https://` reference escapes the repo.
2. *Editable:* content is JSON files. You (or a cheaper model following `docs/content-entry.md`) edit `content/texts/phowa.json` in the GitHub web UI; the validator tells you mechanically if you broke the contract. No tooling to install.
3. *Five years:* the only dependencies are web standards (ES modules, custom properties, service worker, Wake Lock) — all Baseline-stable. Nothing to rot. The 2031 you can open any file and read it.
4. *Old phone:* no framework to parse; the shell is a few KB of JS; texts load per-text, not all at once. Fonts are the heavy item (~1.8 MB total, dominated by Jomolhari at ~1 MB) — cached once by the SW, subsettable later if first-load matters.
5. *GH Pages:* serve the repo root (or `main` branch / `docs` folder — cosmetic choice). No Actions required to deploy.
6. *Typo fix:* edit the JSON, commit. Done.

**Honest costs:**

- ES modules and `fetch()` don't run from `file://`. Local preview needs any static server (`python3 -m http.server`) — one documented line, but it is a real step you don't have today with the single-file app.
- Service workers demand version discipline: a cache-version string must be bumped when content changes, or users see stale text. Mitigation: the SW cache key is derived from a single `VERSION` constant, and `docs/content-entry.md` step 5 is "bump it"; a CI check fails if content changed and the version didn't.
- Hand-rolled rendering means discipline is on us, not a framework. The audit shows this is viable — the Ngondro engine is already the hard part, and it's written.
- Multiple files means the app is no longer trivially copyable as one artifact (see Option B's virtue).

## 3. Option B — the same content model, plus a trivial inliner build to one file

**The shape.** Same repo layout and same JSON contract as A, but a ~150-line dependency-free Node script (`scripts/build-single.mjs`) bakes shell + content + base64 fonts into one `dist/index.html` — a direct descendant of today's Ngondro file. GitHub Pages serves the built file (committed, or built by an Action).

**What it buys:** a single artifact that runs from `file://` — copyable over AirDrop or a USB stick to a phone that has *never* had network. That is the strongest possible reading of "works offline, forever": no first-visit-online requirement at all, which a PWA cannot avoid.

**What it costs, honestly:**

- A build step exists. Typo fix = edit JSON *and* rebuild — either you run a command (violates criterion 6) or an Action rebuilds on push (violates criterion 5's "no CI mystery": deploys now depend on a robot whose failure mode you'd have to debug in five years).
- Base64 fonts inflate ~33%; the artifact lands around 4–6 MB once the cycle and images are in. Parsing one giant HTML file on an old phone is measurably worse than A's lazy per-text JSON.
- Iconography (Phase 4) makes single-file genuinely ugly: every deity image inlined into every copy of the page.

## 4. Option C — framework SPA with a real build (the KGK-Ngondro prototype path)

Preact/React + Vite + TypeScript, components, a bundler. Included because it's the default answer in 2026 and the prototype already exists.

**What it buys:** declarative rendering (layer toggles and modes become `state → view`), types on the schema, a dev server.

**Why it fails this brief:** `node_modules` is a rot event on a five-year fuse (the prototype already imports React from a CDN that may not outlive it); every change requires the build to run somewhere (criteria 5, 6 dead on arrival); the bundle must be rebuilt to fix a comma; and Bardo's UI surface — deliberately animation-free, few controls — doesn't need the machinery. The prototype was the right way to explore the design. It is the wrong way to keep it alive.

---

## 5. Ranking and recommendation

**A > B > C.**

**Recommendation: Option A**, with one element of B adopted cheaply: because A's content contract and B's inliner are compatible, a snapshot script can exist later (Phase 5+, if you want it) as an *optional artifact generator* for sneakernet distribution — without ever becoming the deploy path. Decide that then; nothing in A precludes it.

C is rejected outright. The existing React prototype stays as design reference only.

**One decision folded in:** the PWA install prompt will not be pushed at the reader (no banners — §2's no-dark-patterns covers this); offline capability works from the first visit whether or not they "install."

---

## 6. How the §9 context-of-use requirements land in Option A

| Requirement | Implementation |
|---|---|
| Screen must not sleep | `navigator.wakeLock.request('screen')` while a text is open; re-acquired on `visibilitychange`. Fallback where unsupported: no hack (video loops burn battery at a deathbed) — a one-line quiet notice in settings telling the reader to raise their auto-lock. |
| Resume exactly | Persist per-text: topmost visible block id + fractional offset within it, written on a 500 ms debounce to localStorage. Restore by block id, not pixel offset — survives font-size changes, reflows, app death, phone death. The block-anchor also powers position-keeping across re-renders (audit §3). |
| No destructive gestures | No swipe navigation anywhere. Navigation is explicit taps in the bottom bar. Browser back is the only back. |
| One-handed | All controls in a bottom bar (Ngondro's layout, kept); nothing essential in the header. |
| No animation | The `tokens.css` motion block defines only the scroll; entrance/pulse animations from Ngondro are not ported. `prefers-reduced-motion` handling kept regardless. |
| Auto-scroll | The Ngondro engine, lifted (audit §1), plus a visible speed value. |
| Text size | Min 16 / default 19 / max 48 (approval pending), anchor-compensated re-render. |
| Dim night mode | Palette doc; `prefers-color-scheme` respected on first run. |

**Voice mode** (BRIEF §5) is a render-mode flag, not a separate page: same data, same scroll engine; L0 collapses to a thin marker, L4 drops away, L1/L2/L3 render at Voice scale. One tap from anywhere on the persistent bottom bar. Designed first in Phase 2, as instructed.

---

## 7. Content pipeline and the delegation boundary (BRIEF §11)

```
your source documents (.docx drafts)
        │  (entry: you, or a cheaper model following docs/content-entry.md)
        ▼
content/texts/<text-id>.json     ← the schema is the contract
        │
        ▼
scripts/validate.mjs             ← fails loudly; runs in CI and locally
        │
        ▼
the app renders data; it never interprets prose
```

- The validator (spec in `SCHEMA.md`) is what makes delegation safe: bulk entry is checked mechanically; layer tagging of ambiguous passages, translation, and terminology stay with you.
- **`.docx` ingestion is an open question** (§8 Q2 below). If your drafts are consistently styled (the `◆ READ ALOUD` + amber convention), a one-off local extraction script is feasible — but reading `.docx` needs either a third-party package (asks permission first, used offline at entry time only, never shipped in the app) or manual copy-paste entry. Which path is worth it depends on how much corpus is already digitized — your answer decides this.

---

## 8. Open questions before Phase 1 (from BRIEF §12, plus two)

1. **Repo**: answered by circumstance — `DonAndrutto/BardoOS` exists and this proposal targets it. Confirm.
2. **Corpus digitization**: how much exists, in what form? If `.docx`: may I add a single extraction dependency for a local, entry-time-only script (never shipped), or do you prefer manual entry against the schema?
3. **Phonetics scope**: all texts, or liturgical only? The schema makes `phon` optional per block either way; this decides validator strictness (whether missing `phon` on L2/L3 is an error or normal).
4. **Audio dimension**: if future versions may carry recorded audio, the block `id` scheme is the sync anchor — block ids must be stable and per-utterance. The draft schema already assumes this; confirm audio is plausible so I keep ids utterance-grained.
5. **Copy-prevention and pinch-zoom lock** (kept from Ngondro, or relaxed for Bardo?) — flagged in the audit §6.
6. **The shad-integrity rule** for Tibetan blocks — exact rule proposed in `SCHEMA.md` §7; needs your confirmation since it touches the text itself.

Everything else in this document proceeds on your single "approved" — these six need words from you.
