# Mandala preview: continuation handoff

The current implementation is a buildless feature at `mandala/`, reached from the home page's Iconography shelf, the Iconography navigation menu and the reader-header link. It shares the reader's typography, colour tokens, header treatment and saved day/night preference. It opens a drawn SVG mandala with zoom, pan, keyboard controls, filters, individual/group panels and owner-supplied artwork. A toggle displays the source painting. The atlas shows locations and artwork. Research records and the evidence panel helper are kept under `docs/mandala/`, outside the app deployment. The back link returns directly to Iconography; the brand returns home.

## Palace walls and the reader-facing atlas

The square wall bands use shared mitered contours. A diagonal vajra sits at each turn of the red frieze. The black frieze has a quarter garland at each corner, and the gate returns alternate cream/red and yellow/green.

The runtime contains display coordinates, location names, and artwork links. The original placement records and evidence helper remain under `docs/mandala/`. Vercel excludes those files and the atlas handoff from app deployments.

## Drawn geometry and production updates — 14 November 2026

The atlas uses `scripts/mandala-layout.mjs` for the evenly spaced central circles, six circles per family petal and symmetric ring and gate seats. In Original painting mode, the overlay follows the recorded observations. Close zoom exposes individual circles once their centers are at least 16 screen pixels apart. Their highlights use the circle color, and each opens the associated location panel with its existing placement notes.

The shared palace contour defines four identical gate returns. The red frieze has gold flowers and corner scrolls, the dark frieze has beaded garlands, and the four wall fields have scrolls in the painting's directional colors. The protective enclosure has curling flame tongues, a continuous vajra fence, and blue water and wind ribbons behind the landscape scenes.

BardoOS is linked to Vercel. PR branches get previews and merges into `main` publish automatically to [the live atlas](https://bardo-os.vercel.app/mandala/). Commit the regenerated bundle, diagram and manifest alongside source changes. The mandala CI check verifies that they match the source. Bump the service-worker version when updating atlas runtime files so installed copies refresh.

## App integration and artwork previews — 14 November 2026

- Replaced the separate atlas branding and palette with the existing Bardo OS header, Inter/EB Garamond typography, warm backgrounds, accent colour and restrained controls. Removed ornamental character icons, using consistent SVG controls where an icon is useful.
- Added a dedicated Mandala atlas entry in the home Iconography shelf and navigation. Preserved the existing Zhitro Mandala introduction entry. Returning to `/#iconography` skips the introduction and restores the Iconography section.
- Added `mandala/shell.js` to share the reader's theme preference and service-worker registration. The atlas's day/night switch persists through the same settings store.
- Hovering a dot, or focusing it with the keyboard, loads an artwork preview without selecting the location or moving the map. Shared depictions appear once with both names, and shared locations preview both assemblies when enabled. Filtering either assembly removes its figures from previews. The preview is dismissible with Escape and can be hovered itself.
- Added bright cream-white marker outlines and a soft light halo for hovered, keyboard-focused and selected circles. Halo dimensions remain readable while zooming. The drawn disc blends into the app background; the original painting remains unmodified.
- Kept a three-column desktop view and a small-screen Locations drawer, map and details flow. Artwork dialogs use the same app styling.
- `mandala/preview.js` contains the preview selection helper. `check-mandala.mjs` exercises all 62 locations across all four layer combinations, checking image deduplication, valid labels, hidden assemblies and the empty palace-only state.
- This revision used service-worker cache `bardo-os-v33-mandala-app-integration-r2` and precached both new scripts.

Browser review covered desktop and narrow layouts, Iconography entry/return, both colour themes, keyboard-triggered artwork previews, Escape dismissal, assembly-filtered previews, location search, artwork viewing and palace-only/show-both controls. Preview images loaded, focus did not select or zoom, and the final page had no console errors. Pointer hover uses the same preview renderer and nearest-location hit testing; direct mouse-hover automation was unavailable. Physical touch gestures and airplane-mode use remain untested. Screenshot: `/tmp/bardo-atlas-ui-desktop.jpg` (temporary QA file).

`check-mandala.mjs`, JavaScript syntax checks, `git diff --check` and `validate.mjs` pass. The content validator retains its existing 13 warnings and 9 declared gaps. Canonical texts, deity IDs and placement qualifications are unchanged.

## Visual refinement — 13 November 2026

- Rebuilt the architectural SVG around the supplied painting's proportions and colours: four-coloured square palace, T-shaped entrances, multiband walls, decorative friezes, nested inner lotus seats and central sanctuary.
- Outside → inside: multicoloured fire, repeating vajra fence, eight charnel-ground landscapes, lotus enclosure, courtyard and palace. The landscapes use the painting's visible hills, striped blue pools, clustered trees, coloured orbs and orange accents. They do not claim to identify a lineage-specific named set.
- One shared SVG definition supplies the mirrored reclining deer and eight-spoked Dharma wheel at all four gates. Parasols and victory banners likewise use shared definitions. Their arrangement follows the painting: four parasols flanking the upper/lower gates, four banners flanking the side gates. Repeating both through all four rotations would overlap them.
- Peaceful and wrathful checkboxes independently control the map, search results and panel artwork. Both off gives Palace only; Show both restores the assemblies. Shared family/gate marks stay while either applicable assembly is visible: the research does not identify each mark's collection. Reference-painting mode keeps the original image intact and explicitly explains that painted marks remain visible.
- All deity marks are now drawn by the interactive layer, not baked into the architectural background. Smaller visible marks retain larger pointer hit areas. Schematic courtyard locations now participate in nearest-point hit testing too.
- Expand view hides the side panels for architectural inspection; selecting a location restores them.
- Replaced peaceful depictions 29–34 with the owner's `6 Munis` PNGs at 1080×1350, converted to lossless WebP. Decoded RGBA pixels match every source exactly, including transparency. The reader and mandala share these same replacements; deity IDs and scripture are unchanged. Source names and SHA-256 hashes are recorded in the atlas provenance.

### Painting-detail continuation

- Studied enlarged crops of `mandala/assets/mandala.jpeg`, including an unwrapped view of its outer rings. The supplied `BARDO materials/Images/Mandala 3D.jpg` clarifies ornamental form; the original painting remains the guide for the plan and colours. This remains a two-dimensional architectural study.
- Redrew the deer with folded legs, raised tapered necks, ears, restrained antlers, eyes and hooves; the wheel now has concentric gilded rims, eight spokes, an orange base and a tapered support.
- Parasols have a narrow cream crown, blue fluted curtain and scalloped border, broad folded saffron fabric, lower concentric lip and gold pole. Banners have orange/blue and red/green tiers with fluted curtains and cream scalloped hems. Side flame-streamers follow the painting's placement.
- Replaced spiky repeated flames with 16 broad coloured fire panels, curling scrolls and small flame seeds. Refined the vajra band with a dark ground, wavy gold edges and larger repeated vajras.
- Replaced the previous generic stupa/skull/pyre/bird vignettes with a continuous landscape projected around the circular enclosure. Restored space between the landscape and courtyard with a blue/green lotus-petal band and coral inner petals. These ornamental counts are drawing choices, not asserted ritual enumerations.
- Service-worker cache version is `bardo-os-v32-mandala-painted-ornaments`.

## Adopted decisions

- Preserve the existing 100 deity IDs and canonical scripture. No scripture edits.
- Keep 59 image observations (56 circles and three ambiguous components), owned by 34 selection targets.
- Add 28 **schematic**, individually selectable Ishvari locations: six per directional courtyard plus one outer gatekeeper per direction. These have empty observationIds and `paintedMarkerObserved: false`. Spatial order is editorial; directions follow wrathful elucidation s12-b002–006.
- Keep the peaceful gatekeeper pairs, four inner wrathful gatewomen and four outer Ishvari gatekeepers distinct.
- Pema Lingpa's seven-per-direction roster is comparative evidence only. Its garuda/goat/lion/dog seventh figures do not replace the Karma app roster's cuckoo/goat/lion/snake outer gatekeepers.
- No exact painted placement is verified. The supplied appendix supports 24+4, explicit peaceful gate pairings and a tentative red-brown Buddhakrodhishvari central candidate. Source variants remain in the data.

## Files and regeneration

`docs/mandala/atlas-source.json` is the portable, editable research/scene/catalog snapshot. `scripts/draw-mandala.mjs` owns the architectural drawing and its repeated symbols. `scripts/build-mandala.mjs` regenerates that SVG, builds the runtime bundle and hashes the locally available assets. Artwork is reused from the existing app directory. The original local research documents, private document links and PDF copies are not published in this package. Bibliographic labels without public links remain readable.

Run `node scripts/build-mandala.mjs`, `node scripts/check-mandala.mjs`, and `node scripts/validate.mjs`. Serve the repository with `python3 -m http.server 43188 --bind 127.0.0.1`, then open `/mandala/`. Runtime files are precached by the service worker; bump its version for later changes.

## Next conversation

Refine palace geometry and interaction polish; resolve observed circles against a diagram-specific key; improve text-to-mandala navigation and return-to-reader state; add cited day indexing. Keep editorial positions separate from observed coordinates and alternate candidates separate from shared seats. Do not silently adopt the decision guide's inconsistent abbreviated IDs or unsupported source attributions.

Validation covers all IDs, assets, geometry ownership, uncertainty, generated-source consistency, repeated architectural symbols, replacement-art provenance and offline paths. Physical-device pinch and airplane-mode operation remain untested. The drawing is a refined architectural study, not a completed traditional reconstruction; positions and alternatives retain the research qualifications above.

Safari checks on this revision confirmed initial rendering, peaceful-only (16
locations), wrathful-only (54 locations), both off (zero locations and selection
cleared), and assembly-specific artwork in the shared eastern family panel.
Reloading its deep link restored both assemblies and the selected family.
The continuation's in-app browser review confirmed the rendered drawing at fit
and 2.7×, including the gate details, fire/vajra/landscape rings and expanded
palace-only view at the available narrow viewport. It revealed and fixed the
overlap between adjacent banners and parasols. The final page had no browser
console errors. Screenshot checkpoints are `/tmp/mandala-painted-details.jpg`
and `/tmp/mandala-painted-overview.jpg` (temporary QA files).
`check-mandala.mjs`, JavaScript syntax, SVG XML parsing and `validate.mjs` pass;
the validator retains the existing 13 content warnings and declared content gaps.
