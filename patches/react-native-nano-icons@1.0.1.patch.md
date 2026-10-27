# react-native-nano-icons+1.0.1.patch

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
inline views on the baseline (and nano-icons' version check accounts for it).
