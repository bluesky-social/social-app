# `@bsky.app/video` patch

## Android: horizontal visibility in `isViewableEnough()`

`isViewableEnough()` compared the view's own size with itself, so any attached
and shown video counted as fully visible. With `react-native-pager-view` 9
(Compose `HorizontalPager`, `beyondViewportPageCount = 1`) the page next to the
current one stays attached, so a video on the page you swiped away from kept
playing. It now uses `getGlobalVisibleRect()`, which clips against every
ancestor, and requires at least half of the view to be visible.

## Android: early `return` in `updateActiveView()`

A bare `return` inside `views.forEach {}` returned from `updateActiveView()`
itself, so a single non-viewable video skipped the rest of the selection
(including clearing the active view). Changed to `return@forEach`.

The app calls `updateActiveVideoViewAsync()` from `Pager.tsx` when the pager
settles, which is what makes both platforms re-pick the active video on page
change (iOS already measures against the window bounds).
