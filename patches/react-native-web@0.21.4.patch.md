# react-native-web@0.21.4.patch

## Don't preprocess compiled (`$$css`) style objects

Upstream issue: https://github.com/necolas/react-native-web/issues/2943
Upstream PR: https://github.com/necolas/react-native-web/pull/2944
(this patch is the same change, applied to `src`, `dist` and `dist/cjs`).
Remove this patch once a release includes it.

When RNW resolves a style array, it runs every object that wasn't registered
with `StyleSheet.create` through `preprocess`, including compiled objects
(`$$css: true`) whose values are already class names. ALF's `hover()` returns
such objects. `preprocess` is meant for React Native style objects, so for
compiled ones it:

- drops or renames some keys (e.g. `shadowColor`, `textAlignVertical`);
- never localizes `$$css$localize` objects;
- returns a new object every time, which defeats styleq's per-object cache for
  that style and every style before it in the array. One `hover()` in an
  array of 6 atoms made each resolve about 4x slower (~1,250 → ~310 ns).

The patch passes compiled objects straight to `localizeStyle`, the same path
`StyleSheet.create` styles take.

## Pressable: only keep interaction state that something can read

Not reported upstream yet.

RNW's `Pressable` stores `hovered`, `focused` and `pressed` in state and
updates them on every hover, focus and press. Only a function `style` or
`children` can read that state, though. Otherwise each change re-rendered the
`Pressable` and its `View` for nothing. That covers every feed row (the legacy
`Link` renders a `Pressable`) and every `Button` that gets its hover from CSS.

The patch keeps that state in a ref instead, so it's always current, and
setting it only re-renders when something can read it, i.e. when `style` or
`children` is a function. A render for any other reason still reads the
current value. So if `style` becomes a function while the element is hovered,
it sees `hovered: true` straight away. The `onHoverIn`/`onHoverOut`/
`onPressIn`/`onFocus`/… callbacks fire as before.

This was checked against upstream's own `Pressable` tests, plus two new ones:
- hover doesn't re-render without a reader; this one fails without the patch;
- a style function added mid-hover reads the hover state.

Upstream's full unit suite and Flow pass too. In the app, measured with a React
commit hook on a dev build, hovering a feed row or a CSS-hover `Button` went
from a commit per enter/leave to none.
