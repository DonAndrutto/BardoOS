# @chenglou/pretext — vendored

**Version 0.0.8.** MIT (see `LICENSE`). Upstream:
<https://github.com/chenglou/pretext>.

## Why it is here rather than in a `package.json`

Bardo OS has no build step, no `package.json`, and no `node_modules`:
what is in the repository is what ships (`docs/architecture.md` §2), and
the app must still open in five years with nothing installed. Third-party
code follows the same discipline the fonts already do — vendored whole,
unmodified, with its licence and its provenance beside it.

These are the package's published `dist/*.js` files, copied verbatim.
They are plain ES modules with relative `./x.js` imports, so the browser
loads them directly; nothing bundles or transpiles them.

## Refreshing it

```sh
# in a scratch directory, never in this repository
npm install @chenglou/pretext@<version>
cp node_modules/@chenglou/pretext/dist/*.js            js/vendor/pretext/
cp node_modules/@chenglou/pretext/dist/generated/*.js  js/vendor/pretext/generated/
cp node_modules/@chenglou/pretext/LICENSE              js/vendor/pretext/
```

Then bump `VERSION` in `sw.js`, or returning readers keep the old cache.

Type declarations and source maps are not copied: there is no TypeScript
here, and a map with no build to point at is dead weight on a slow line.

## What Bardo OS uses it for

`js/measure.js` is the only module that imports it; everything else goes
through that. See the header there.

`prepare()` needs `Intl.Segmenter` and Canvas 2D. Both are Baseline, but
`js/measure.js` treats them as optional anyway and falls back to DOM
measurement where they are missing — the reading surface never depends on
a measurement being available.
