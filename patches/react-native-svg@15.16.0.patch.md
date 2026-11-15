# react-native-svg@15.16.0.patch

Three independent changes:

## Android: cache parsed `d` paths in PathView

`PathView.setD` re-parses the SVG path string on every mount. Our icons are
static, so parsed `Path`/`PathElement` results are memoized in a process-wide
cache keyed by the `d` string. The cache grows forever, which is acceptable for
a bounded icon set.

## Web: strip `collapsable` before spreading props onto DOM elements

react-native-web's vendored `useAnimatedProps` force-injects
`collapsable: false` into every `Animated.createAnimatedComponent` wrapper (its
View/Text filter it back out, but third-party components don't). react-native-svg's
web `prepare()` spreads unknown props straight onto the DOM node, so any
animated svg element (e.g. `react-native-progress` circles/pies) hits React
DOM's dev error:

    Received `false` for a non-boolean attribute `collapsable`.

The patch adds `collapsable` to the discarded destructure in
`web/utils/prepare` (src + lib/module + lib/commonjs). Not fixed upstream as of
15.16.0 (`src/web/utils/prepare.ts` is byte-identical to 15.15.4).

## Types: delete the `.web.d.ts` declarations

Deletes `lib/typescript/ReactNativeSVG.web.d.ts` and `lib/typescript/elements.web.d.ts`
(and their `.d.ts.map` files). `tsconfig.check.web.json` sets
`moduleSuffixes: [".web", ""]`, so without this the web type-check pass resolves
`react-native-svg` to the web-only class declarations (`WebShape` subclasses),
whose props and instance types differ from the cross-platform ones the app is
written against. Deleting them makes every platform pass use the same
`ReactNativeSVG.d.ts`/`elements.d.ts`. Added in #11146 together with
`moduleSuffixes`. 15.16.0 adds one more web declaration,
`lib/typescript/lib/resolveAssetUri.web.d.ts`, but no other declaration
imports it, so it is left alone.

These are header-only deletions (no preimage, as `pnpm patch-commit` writes
them), which pnpm's applier handles; `git apply` refuses them, so check the
content hunks with `git apply --check --exclude='lib/typescript/*'`.

## 15.16.0 port

Regenerated against the pristine 15.16.0 tarball. The content hunks are
unchanged: `PathView.java` and `src/web/utils/prepare.ts` are byte-identical to
15.15.4, and the compiled `prepare.js` files only changed outside the hunks
(optional-chaining output). Only the `index` lines changed, including the
deletion of `elements.web.d.ts`/`.map`, whose contents changed upstream
(`Defs` now extends `WebShape<PropsWithChildren<BaseProps>>`).
