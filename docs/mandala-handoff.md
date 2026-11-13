# Mandala preview: continuation handoff

The current implementation is an optional, buildless feature at `mandala/`, reached by a small reader-header link. It opens a drawn SVG mandala with zoom, pan, keyboard controls, filters, individual/group panels and existing artwork. A toggle displays the source painting. Evidence and alternatives are collapsed by default. The brand returns to the reader.

## Adopted decisions

- Preserve the existing 100 deity IDs and canonical scripture. No scripture edits.
- Keep 59 image observations (56 circles and three ambiguous components), owned by 34 selection targets.
- Add 28 **schematic**, individually selectable Ishvari locations: six per directional courtyard plus one outer gatekeeper per direction. These have empty observationIds and `paintedMarkerObserved: false`. Spatial order is editorial; directions follow wrathful elucidation s12-b002–006.
- Keep the peaceful gatekeeper pairs, four inner wrathful gatewomen and four outer Ishvari gatekeepers distinct.
- Pema Lingpa's seven-per-direction roster is comparative evidence only. Its garuda/goat/lion/dog seventh figures do not replace the Karma app roster's cuckoo/goat/lion/snake outer gatekeepers.
- No exact painted placement is verified. The supplied appendix supports 24+4, explicit peaceful gate pairings and a tentative red-brown Buddhakrodhishvari central candidate. Source variants remain in the data.

## Files and regeneration

`mandala/data/atlas-source.json` is the portable, editable research/scene/catalog snapshot. `scripts/build-mandala.mjs` builds the runtime bundle and hashes the locally available assets. Artwork is reused from the existing app directory. The original local research documents, private document links and PDF copies are not published in this package. Bibliographic labels without public links remain readable.

Run `node scripts/build-mandala.mjs`, `node scripts/check-mandala.mjs`, and `node scripts/validate.mjs`. Serve the repository with `python3 -m http.server 43188 --bind 127.0.0.1`, then open `/mandala/`. Runtime files are precached by the service worker; bump its version for later changes.

## Next conversation

Refine palace geometry and interaction polish; resolve observed circles against a diagram-specific key; improve text-to-mandala navigation and return-to-reader state; add cited day indexing. Keep editorial positions separate from observed coordinates and alternate candidates separate from shared seats. Do not silently adopt the decision guide's inconsistent abbreviated IDs or unsupported source attributions.

Validation covers all IDs, assets, geometry ownership, uncertainty, generated-source consistency and offline paths. Browser checks covered entry/return, courtyard selection, artwork, painting toggle and filters in the previous implementation session. Physical-device pinch and airplane-mode operation remain untested. Current SVG is a functional schematic, not a completed traditional reconstruction.
