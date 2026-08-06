# Deity images

`MANIFEST.json` is the roster of the peaceful and wrathful deities;
`images/` holds their pictures. Both are the owner's to supply — nothing
here is scraped, downloaded, or generated (BRIEF §7).

- `images/zhiwa/` — the 42 peaceful deities of the *bardo* of *dharmatā*,
  in 36 files (six show a couple in union). WebP, cut out with no
  background, converted from the owner's PNG masters with the alpha
  channel verified bit-identical.
- The wrathful 58 follow on the same machinery.

A figure appears only where a manifest record carries an `image`, and
only where the owner has marked that deity's name in the text
(`[[words|deity-id]]`, `SCHEMA.md` §4).

The full procedure — record shape, converting and verifying images,
marking a name, and the one line to bump afterwards — is in
[`docs/deity-images.md`](../../docs/deity-images.md). The contract the
validator enforces is `SCHEMA.md` §9.
