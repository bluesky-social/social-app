# @bsky.app__alf@0.2.1.patch

## Web: atomic CSS classes and `hover()`

Toolbox PR: https://github.com/bluesky-social/toolbox/pull/77 (this patch is
that PR's `src` changes and their built `dist` output, minus source maps).
Linear: APP-3764. Remove this patch and bump ALF once a release includes it.

ALF's atoms are plain objects, so react-native-web resolves every ALF style
into an inline `style` attribute on every render. The PR registers the atoms
and every theme's `t.atoms` with `StyleSheet.create` on web. RNW then compiles
each one, once, into shared atomic CSS classes. Atom objects are unchanged, so
reading values such as `a.text_md.fontSize` still works. On native, and in
`@bsky.app/alf/core`, the new `compile()` step does nothing.

It also adds:

- `compile()`: the same step, exported for apps' own atoms.
- `hover(style)`: paint-only styles (colours, opacity, text decoration),
  applied through a CSS `:hover` rule inside `@media (hover: hover)` instead of
  JS state. It's a no-op on native.
- `utils.flatten` on web skips `hover()` results. Their values are class
  names, so merging one into a plain style breaks the whole style.

Plus small cleanups: `flex_0` uses flex longhands on every platform, and stale
native atom overrides are gone. One of those is a behaviour change on native:
`a.pointer` now sets `cursor: 'pointer'`, so iPad pointers get hover effects.

On web, classes change how styles combine:

- Inline styles beat every class and every `:hover` rule. A component's own
  inline styles now beat atom overrides from its callers, and a `hover()` base
  must be an atom or another created style.
- When one style mixes shorthands and longhands, the longhand wins, as on
  native.
- RNW's `<style>` is the first thing in `<head>`, so rules in `src/style.css`
  with equal specificity (e.g. `[data-tooltip]`) beat atom classes.
