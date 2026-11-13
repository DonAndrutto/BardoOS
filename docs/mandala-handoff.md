# Mandala preview: continuation handoff

The current implementation is an optional, buildless feature at `mandala/`, reached by a small reader-header link. It opens a drawn SVG mandala with zoom, pan, keyboard controls, filters, individual/group panels and owner-supplied artwork. A toggle displays the source painting. Evidence and alternatives are collapsed by default. The brand returns to the reader.

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

`mandala/data/atlas-source.json` is the portable, editable research/scene/catalog snapshot. `scripts/draw-mandala.mjs` owns the architectural drawing and its repeated symbols. `scripts/build-mandala.mjs` regenerates that SVG, builds the runtime bundle and hashes the locally available assets. Artwork is reused from the existing app directory. The original local research documents, private document links and PDF copies are not published in this package. Bibliographic labels without public links remain readable.

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
