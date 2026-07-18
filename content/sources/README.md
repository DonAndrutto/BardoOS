# Source documents

The owner's raw source documents, exactly as uploaded — awaiting content
entry against the contract (`SCHEMA.md`, walkthrough in
`docs/content-entry.md`).

These are **not** contract files. They live outside `content/texts/`
because everything in that directory is validated as a finished text:
one JSON per text, id equal to the filename, every block layer-tagged.
A raw draft parked there fails CI.

Current holdings:

- `Bardo Of Dharmatha Peaceful.json` — draft of the peaceful days; the
  entered, validated version is `content/texts/bardo-thodrol.dharmata-intro.json`.
- `Bardo Of Dharmatha Wrathful.json` — Part Two (the wrathful days,
  Days 8–12). Not yet entered: the source carries no ◆ READ ALOUD
  shading, so its layer tagging awaits the owner (docs/catalogue.md,
  note 5). Catalogued as `bardo-thodrol.wrathful-elucidation`, forthcoming.
- `Bardo Thodrol bilingual.docx` — the owner's bilingual working document.

Nothing here ships in the app; the renderer reads `content/texts/` and
`content/cycle.json` only.
