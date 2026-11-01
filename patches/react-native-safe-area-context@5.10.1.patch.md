# react-native-safe-area-context@5.10.1.patch

## Web: don't count the page's scroll offset as safe area

Upstream PR: https://github.com/AppAndFlow/react-native-safe-area-context/pull/776
(this patch is the same change, applied to `src`, `lib/module` and
`lib/commonjs`). Remove this patch once a release includes it.

On web, 5.10 clamps the window's safe area insets to the part overlapping the
provider view, using its `getBoundingClientRect()`:

```js
top: Math.max(0, windowInsets.top - rect.top),
bottom: Math.max(0, windowInsets.bottom - (window.innerHeight - rect.bottom)),
```

Our root `SafeAreaProvider` scrolls with the window, so once the feed is
scrolled `rect.top` is about `-scrollY` and `rect.bottom` is far below the
viewport. The top inset becomes roughly the scroll offset, and the bottom one
grows the same way. 5.10 also re-measures on every window `resize`, which
mobile browsers fire whenever the address bar shows or hides. Each time, the
whole app re-renders with a top inset thousands of pixels tall: a blank band
opens above the feed, the page jumps, and scrolling stutters.

The patch only lets an edge that's inside the viewport shrink the inset, as
`Math.max(0, rect.top)` and so on, so a provider that runs past the viewport
gets the window's own insets.
