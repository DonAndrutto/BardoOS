# Deity images

`MANIFEST.json` holds the collections; `images/` holds their pictures.
Both are the owner's to supply — nothing here is scraped, downloaded, or
generated (BRIEF §7).

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

The full procedure — the model, converting and verifying images, marking
a name, and the one line to bump afterwards — is in
[`docs/deity-images.md`](../../docs/deity-images.md). The contract the
validator enforces is `SCHEMA.md` §9.
