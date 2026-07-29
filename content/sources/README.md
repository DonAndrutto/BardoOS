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
- `Bardo Of Dharmatha Wrathful.json` — an earlier draft of the wrathful
  days, carrying no ◆ READ ALOUD shading. Superseded for content entry by
  the shaded document below; kept for reference.
- `Bardo Thodrol Part Two bilingual.docx` — Part Two, the wrathful days,
  with the ◆ READ ALOUD shading applied and the days broken out under
  their own headings. This is the source of record for
  `content/texts/bardo-thodrol.wrathful-elucidation.json`.
- `Bardo Thodrol bilingual.docx` — the owner's bilingual working document.

Nothing here ships in the app; the renderer reads `content/texts/` and
`content/cycle.json` only.
