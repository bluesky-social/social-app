# react-native-svg@15.15.4.patch

Independent fixes:

## Android: cache parsed `d` paths in PathView

`PathView.setD` re-parses the SVG path string on every mount. Our icons are
static, so parsed `Path`/`PathElement` results are memoized in a process-wide
cache keyed by the `d` string. The cache grows forever, which is acceptable for
a bounded icon set.

## Android: cheaper `SvgView` drawing in scrolling lists

`SvgView` renders its element tree in software into a `Bitmap` and draws that.
Three changes cut the cost of that in feeds, where every row has ~7 icons:

- **Keep the bitmap across detach.** Upstream recycles it in
  `onDetachedFromWindow`. Lists with `removeClippedSubviews` detach and
  re-attach rows constantly while scrolling, so every icon was re-rendered on
  the UI thread and re-uploaded as a new GPU texture each time its row came
  back. The bitmap is still dropped on `invalidate()` (prop/size changes).
- **Share bitmaps between identical svgs.** A process-wide LRU (8 MB) maps
  "svg props + pixel size + every element's class and props" to the rendered
  bitmap, so the same icon in every row renders once and all instances draw
  one `Bitmap` (one GPU texture). Props are recorded in `updateProperties` on
  `SvgViewManager`/`VirtualViewManager`. Only trees of plain groups and basic
  shapes (path, circle, rect, ellipse, line) without touch handlers are
  cached; text, images, gradients, masks, etc. render per view as before.
  Shared bitmaps are never recycled; views just drop the reference. Prop
  changes still invalidate via `invalidateSvgView` after each update
  transaction, which re-keys on the next draw.
- **Don't draw element views.** Svg elements are mounted as child views (2 per
  icon), but their pixels come from `VirtualView.render()` into the bitmap.
  `SvgView.drawChild` now skips them, so their empty RenderNodes stay out of
  the display list and the RenderThread doesn't walk them every frame.

Measured on a Xiaomi Mi 9T (Android 10, release build, scripted feed scroll):
icon re-renders went from 487 to 0 per 16 s of scrolling, and RenderThread
issue time p90 dropped ~1-2 ms. A `RNSVG drawOutput` trace section marks the
remaining software renders.

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
