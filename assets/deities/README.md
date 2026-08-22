# Iconography images

`MANIFEST.json` holds the collections and the plate sets; `images/`
holds their pictures. All are the owner's to supply — nothing here is
scraped, downloaded, or generated (BRIEF §7).

A **deity** is an identity; a **depiction** is a picture. They are kept
apart because six of the pictures show a couple in union: the peaceful
collection is 42 deities carried by 36 depictions, and tapping either
half of a pair opens the one they share.

- `images/zhiwa/` — the 42 peaceful deities of the *bardo* of
  *dharmatā*, in 36 WebP files, cut out with no background, converted
  from the owner's PNG masters with the alpha channel verified
  bit-identical.
- The wrathful 58 follow as a second entry in `collections[]`.

A figure appears only where a depiction shows that deity, and only where
the owner has marked that deity's name in the text
(`[[words|deity-id]]`, `SCHEMA.md` §4).

A **plate** is the other kind of picture: one whole arising, supplied
whole. Its identity and its picture are the same thing, so it is held in
`plateSets[]` rather than among the deities, and it opens from the
section heading that names its day (`plateRef`, `SCHEMA.md` §3).

- `images/days/` — days 1–7 of the *bardo* of *dharmatā*, seven WebP
  composites, converted the same way and verified the same way.

The full procedures — the models, converting and verifying images,
marking a name or a heading, and the one line to bump afterwards — are
in [`docs/deity-images.md`](../../docs/deity-images.md) and
[`docs/day-plates.md`](../../docs/day-plates.md). The contract the
validator enforces is `SCHEMA.md` §9.
