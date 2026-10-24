# Page mode

The text can be turned like a book's pages instead of scrolled. The page
icon (directly after Faster **+**) switches between the two; the choice is
saved with the other settings (`readingMode` in `js/store.js`).

It is a port of the owner's Ngöndro reader (`DonAndrutto/Ngondro`, PRs
#21 "Port Ewam page reading mode" and #22 "Match Ewam page-mode gesture
mechanics"), which is the Ewam reader's, so the three apps turn their
pages alike. Everything is in `js/pages.js`; the gesture engine is copied
verbatim between its `EWAM_READER_GESTURES` markers.

## How it works

- **Units.** The title, every section, and the links at a text's foot
  (`.text-foot`) are each a unit. Only the unit being read is laid out.
- **Native columns.** That unit is set in CSS columns one page wide and
  one page tall. The browser breaks it at line boxes, so a page always ends
  on a whole line, a long paragraph simply continues on the next page, and
  a heading is never stranded at the foot of one. A turn is a
  `translateX` of one column: nothing animates and nothing is rebuilt.
- **Where the page stands.** Fixed between the header (gone in Voice mode
  and fullscreen) and the whole bottom bar, which carries the page
  controls, the way back and any invitation. On a very short landscape
  screen the type gives way before the page does.
- **Only on a text.** The doorway, the list of texts and the galleries go
  on scrolling.

## Turning

| Input | Does |
|---|---|
| ‹ › above the bar | previous / next page |
| Tap the left or right quarter of the page | previous / next page |
| Swipe left / right | next / previous page |
| Pinch / spread | text size −1 / +1, once per gesture |
| → ↓ PageDown Space · ← ↑ PageUp Shift+Space | next · previous |
| Home / End | first / last page of the section |
| Mouse wheel | one page per notch |

Taps on a name, a heading that opens a plate, or any control do what they
always did. While a viewer, the contents sheet, the help overlay, the
language menu or the catalogue overlay is open, nothing turns. The custom
touch listeners are attached only while pages are showing; in scroll mode
scrolling is entirely native. Auto-scroll is disabled in page mode.

## Keeping the place

The reader's place is the first character of the page they turned to,
held by DOM identity rather than by page number, because at another size
page 3 of 5 is somewhere else entirely. After any reflow (type size,
TIB/PHO/ENG, Voice mode, fullscreen, a turned phone, a peeked rubric),
the page shown is the one holding that character. The place is kept
through any number of reflows and is reset only by a page the reader
turns to. (Re-taking it after each reflow would walk it backwards, a
little on every tap of the size control; this is the one deliberate
departure from the Ngöndro code.)

Switching modes keeps the same words both ways: into pages, the page that
holds the line being read; back to scrolling, that page's first line put
at the reader's line (`anchor.land` in `js/anchor.js`).

The contents sheet jumps to a section's first page, and in both modes now
marks the section the reader is in.
