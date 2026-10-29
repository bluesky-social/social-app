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
inline views on the baseline (and nano-icons' version check accounts for it):
https://github.com/react/react-native/issues/59549,
https://github.com/react/react-native/pull/59551.

## Android drawables keep the SVG viewBox

`lib/commonjs/src/core/pipeline/prepareSymbol.js`,
`lib/commonjs/cli/buildSymbols.js`

nano-icons fits each native symbol to its content bounds, so padding doesn't
shrink a tab bar icon. For the VectorDrawables it crops the viewport to the
paths and shifts them into place with a translating `<group>`. Our native menus
(`<Menu.Root inline>`) show these drawables through `@expo/ui`'s `Icon`, which
breaks in two ways:

- Material menu icons expect the 24dp box with its built-in padding, which our
  SVGs already have, so content-fit icons render too big.
- `@expo/ui` parses drawable XML itself and ignores `<group>`, so the paths draw
  offset and get clipped.

The patch builds the drawables from the SVG's viewBox instead. Their geometry
then matches the in-app icons exactly, and the translate is 0. The iOS symbols
keep the content fit, which is how SF Symbols are sized. The symbol cache key
gets a `+bsky.1` suffix, so outputs built before the patch are rebuilt.

Drop this once nano-icons can build drawables from the viewBox, or once
`@expo/ui` supports `<group>` and we size icons from the content bounds.
