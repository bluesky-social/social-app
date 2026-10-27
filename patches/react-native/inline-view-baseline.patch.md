## RCTTextLayoutManager.mm Patch - inline views sit below the baseline on iOS

A `View` nested in a `Text` (an attachment) should sit with its bottom on the
text baseline, as it does on Android and on web. On iOS it is placed at the
bottom of its line fragment plus the descender of the attachment run's font.
That is wrong in two ways:

- React Native never sets a font on the attachment run, so `NSTextStorage`
  fills in its default, 12pt Helvetica, whatever the surrounding text is. The
  descender used is always -2.76pt, so the view lands `|text descender| - 2.76`
  below the baseline even without a `lineHeight` (about 0.9pt at 15pt text,
  3pt at 24pt).
- With a `lineHeight` taller than the font, React Native centers the glyphs in
  the line with a baseline offset (`RCTApplyBaselineOffset`), and the
  attachment doesn't get that offset. That adds another
  `(lineHeight - font.lineHeight) / 2`.

Both terms grow with the text size, so Dynamic Type makes it much worse. With
`text_md` (15pt, `lineHeight: 1.3`) a verification badge in a notification sits
about 2pt low at the default text size and about 5pt low at the accessibility
sizes (APP-3683).

The patch places the attachment from the baseline TextKit actually laid its
line out with: the line fragment's origin plus the attachment glyph's location,
which already includes the baseline offset. `react-native-nano-icons` does the
same layout to correct its inline icons (`NanoIconInlineBaseline.mm`).

The current formula came from facebook/react-native#53341 (first in 0.82).
Repro: `~/Documents/Programming/inline-view-baseline-repro` (not yet
published), where the patched placement sits exactly on the baseline for every
font size and `lineHeight` tested, at the default and accessibility text sizes.
