## ReactScrollViewHelper.kt Patch - throttle scroll state updates while scrolling (Android)

On Android, `ReactScrollView` and `ReactHorizontalScrollView` send a Fabric state update with the
new content offset on every `onScrollChanged`, i.e. on almost every frame of a scroll or fling.
Each state update clones the scroll view's shadow node up to the root and commits the shadow
tree on the JS thread (layout, diff), then mounts the transaction on the UI thread. While
scrolling a feed on a Galaxy A16 that was ~50 commits per second, about 40% of the JS thread's
commit time.

The patch sends at most one of these updates per 100 ms per scroll view while scrolling, and
schedules a trailing update when one was skipped, so the state is never stale for more than
100 ms. Touch release and the end of a fling already send an update with the final offset, as
before. Scroll events to JS are unchanged.

The state is only read from the shadow tree (e.g. `measure` on a view inside the scroll view
while it is moving), so the visible behavior is unchanged.

**TODO: Remove if upstream stops committing on every scroll event.**
