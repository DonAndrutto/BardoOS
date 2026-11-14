# Deity navigation

Expanded images in the peaceful, wrathful and Days 1–7 shelves support previous/next buttons, left/right arrow keys and horizontal swipes. Browsing wraps within that shelf and retains the original opener and auto-scroll pause until the viewer closes. Shared depictions appear once, with separate navigation links for each deity.

“Show in mandala” opens `mandala/#deity=<canonical-id>`. The atlas resolves that identity through `deityToCandidateTargets[].targetId`, retaining the current candidate location when applicable. Browsing expanded artwork follows the enabled assemblies in catalog order, deduplicates shared images, and updates both the map selection and a small overview beside the artwork. Placement qualifications remain visible; the navigation does not assert verified locations.

“Show in text” opens `#deity=<canonical-id>` in the reader. The first canonical inline identity marker in the appropriate Dharmatā text determines the landing point. English is revealed so the marked name is visible, and the reader selects the exact name in scroll or page mode. Day plates use `#plate=<plate-id>` and land on the first block of the corresponding section; a rubric destination reveals Guide mode. These links also work after a reload and beneath a hosting subpath. Canonical texts and image manifests are unchanged.

The shared module is `js/iconography.js`, precached by service-worker version `bardo-os-v34-deity-navigation`.

## Checks

Run `node scripts/check-iconography.mjs`, `node scripts/check-mandala.mjs`, and `node scripts/validate.mjs`. The navigation check covers all 100 deity destinations and seven day passages and runs in CI. The content validator retains 13 existing warnings and nine declared gaps.

For browser checks, serve the repository with `python3 -m http.server 8321 --bind 127.0.0.1`, make the Playwright npm package available (install it in a scratch directory and set `NODE_PATH` to that directory's `node_modules` if necessary), and run `node scripts/bench/iconography.cjs`. Set `CHROMIUM_PATH` for an alternate installed Chromium binary; `BARDO_TEST_URL` can point at another local server. The script uses isolated browser contexts and writes screenshots to `/tmp/bardo-*.png`.

Chromium checks cover 1440px and 390px viewports, all three shelves, wraparound, keyboard and synthetic swipe navigation, vertical gestures, paired-deity links, selected mandala locations, focus return to the map, exact name landing in scroll/page and Voice modes, reloads, and cached offline mandala-to-text navigation. Physical-device touch and Safari remain untested.
