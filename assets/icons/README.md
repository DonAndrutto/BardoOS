# The app icon

Cut from the owner's `YK_LOGO_Zhitro_Tagdrol.png` (1025 × 1022) — the
Zhitro mandala on its blue field — on 2026-08-08. This note is here so
the set can be recut from that artwork without measuring it again.

## What ships

| file | size | purpose | disc share of the edge |
|---|---|---|---|
| `icon-192.png` | 192 | manifest, `any` | 0.86 |
| `icon-512.png` | 512 | manifest, `any` | 0.86 |
| `icon-maskable-192.png` | 192 | manifest, `maskable` | 0.64 |
| `icon-maskable-512.png` | 512 | manifest, `maskable` | 0.64 |
| `apple-touch-icon.png` | 180 | iOS home screen | 0.80 |
| `favicon-32.png` | 32 | browser tab | 0.96 |

All six are palette PNGs (256 colours, Floyd–Steinberg, then `oxipng`).
The blue vignette dithers cleanly and the whole set is 268 KB instead of
937 KB — which matters, because `sw.js` precaches every one of them so
the icon survives offline like everything else.

## The three decisions behind those numbers

**The wordmark is dropped.** "BARDO" is illegible below about 120 px and
the launcher prints the app's name underneath the icon anyway.

**Its glow had to be painted out.** In the artwork the white glow behind
the wordmark is composited *over* the mandala's lower rim, from roughly
r = 340 outward. That arc is rebuilt by mirroring the upper rim across
the disc's horizontal axis, cross-faded in over the downward cone
(full within 35°, gone by 55°) and outside r = 320. The outer band is a
repeating scroll motif, so the join does not read — and nothing inside
r = 320 is touched, so the lower gate is the painting's own.

**Maskable is 0.64, not 0.80.** The web spec's safe zone is the centre
80 % circle, but Android's adaptive-icon system shows only the middle
66.7 % of each layer. Rendered against both crops, 0.70 already clips
the rim under the tighter one; 0.64 clears it with a margin and still
fills the circle. The unmasked icons have no such constraint and run to
0.86.

## Recutting

Measured source geometry: the disc is a least-squares circle fit at
centre **(506.5, 474.6)**, radius **423.7**.

1. Rebuild the rim (mirror across y = 474.6, cross-faded as above).
2. Measure the blue field's radial colour profile outside r = 432,
   excluding pixels brighter than luminance 110 — that is the glow.
   Smooth it over five samples; past the artwork's own corners continue
   the vignette at the rate of its last stretch, floored at (2, 34, 78).
3. Cut the disc at r = 426.7 with a 5 px feathered edge, downscale once
   with Lanczos, unsharp (radius 1, 90 % at 512 / 130 % at 192 / 190 %
   at 32), and set it on the rebuilt field at the share above.

The field is then the painting's own, the vignette is the painting's
own, and the seam is invisible at every size.
