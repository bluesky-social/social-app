# react-native-svg@15.15.4.patch

Two independent fixes:

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
2026-08 (main still spreads it).
