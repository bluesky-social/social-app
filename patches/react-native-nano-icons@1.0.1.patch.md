# react-native-nano-icons+1.0.1.patch

## iOS: inline baseline correction

Turns off the library's inline baseline correction on iOS
(`ios/NanoIconInlineBaseline.mm`).

React Native 0.82+ places a view nested in a `Text` below the baseline on iOS.
nano-icons works around that for its own icons: it lays the paragraph out
again with TextKit, matches the icon to an inline view by x position (within
1.5pt), and shifts the glyph so the icon's bottom sits on the baseline.

Our react-native patch (`patches/react-native/inline-view-baseline.patch`)
fixes the placement itself, for every inline view rather than only nano
glyphs, so this correction is redundant. It also gets in the way: it measures
the icon's on-screen frame, so it undoes deliberate offsets such as
`ProfileBadges`' inline nudge, but only for icons that happen to start where
the inline view does.

Drop this together with the react-native patch, once React Native places
inline views on the baseline (and nano-icons' version check accounts for it):
https://github.com/react/react-native/issues/59549,
https://github.com/react/react-native/pull/59551.

## Symbol sets: tight content bounds

The symbol set build (`lib/commonjs/src/core/symbols/layers.js`) scales each
SVG so its content fills the SF Symbol template's cap band. It measured the
content with PathKit's `getBounds()`, which includes curve control points, so
icons drawn with arcs come out too small. The new chat bubble (an almost
complete circle) measured 26.7 units tall instead of 19.1, so it rendered at
about 70% size in the native tab bar. `computeTightBounds()` measures the
drawn outline.

The same bounds feed the Android VectorDrawables, which also get the right
size now.

Not upstreamed yet.
