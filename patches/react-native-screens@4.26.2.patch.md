# react-native-screens+4.26.2.patch

## Android: do not transition RecyclerView children individually

Fixes `Scrapped or attached views may not be recycled` when leaving a screen while a nested ViewPager2 is still settling.

When a screen removal starts, react-native-screens recursively calls `startViewTransition()` on every descendant. Android intentionally keeps a transitioning view's `parent` set after it is removed so that the parent can continue drawing it until `endViewTransition()`.

This violates RecyclerView's requirement that a ViewHolder be fully detached before recycling: if ViewPager2 recycles a page during the screen transition, the holder has been removed from RecyclerView's child array but still reports RecyclerView as its parent.

The patch transitions a RecyclerView as a single unit without recursively transitioning its recyclable children. The matching end traversal skips the same children.

Related issues:
- https://github.com/callstack/react-native-pager-view/issues/1005
- https://github.com/software-mansion/react-native-screens/issues/2461

## iOS: composite secure-view content into JS-pop transition snapshots

Fixes the GrowthHack Follow button flashing to the butterfly logo during
JS-driven pops (custom back button, programmatic `goBack()`).

For a JS-driven pop, React unmounts the screen before the native dismiss
animation runs, so `RNSScreen setViewToSnapshot` freezes the screen with
`snapshotViewAfterScreenUpdates:`. That is a render-server capture, and the
render server excludes `isSecureTextEntry` canvas layers from every capture -
the mechanism expo-privacy-sensitive borrows - so the Follow button is
stripped from the frozen frame and the butterfly behind it shows for the
whole pop animation. Native-first pops (swipe-back, native header back) are
unaffected because they animate the live views and never snapshot.

The exclusion flag is only consulted for layers inside the captured subtree,
so a snapshot rooted below the flagged canvas still includes the content. By
`setViewToSnapshot` time the screen's children are already unmounted (only
the rendered pixels survive on the render server), so the patch captures the
secure subtrees in `willBeUnmountedInUpcomingTransaction` - before the
transaction's mutations apply - stashes them on the screen view via an
associated object, and composites them over the main snapshot at their
converted frames. Each overlay is re-wrapped in a fresh secure canvas so
screenshots/recordings taken during the transition still exclude it.

Known limitation: capturing AVPlayer-backed content this way is racy (the
frozen video is sometimes blank); the overlay still covers the hidden
fallback either way. Plain views (the Follow button) capture reliably.

Verified in a minimal repro (Expo 57 / RN 0.86 / RNS 4.26 / New Arch) at
~/work/rns-secure-pop-repro: zero fallback frames across recorded JS pops
with the patch, ~700ms of visible fallback without it.
