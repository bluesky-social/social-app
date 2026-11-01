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
