# react-native-screens+4.30.0.patch

## Android: do not transition RecyclerView children individually

Fixes `Scrapped or attached views may not be recycled` when leaving a screen while a nested ViewPager2 is still settling.

When a screen removal starts, react-native-screens recursively calls `startViewTransition()` on every descendant. Android intentionally keeps a transitioning view's `parent` set after it is removed so that the parent can continue drawing it until `endViewTransition()`.

This violates RecyclerView's requirement that a ViewHolder be fully detached before recycling: if ViewPager2 recycles a page during the screen transition, the holder has been removed from RecyclerView's child array but still reports RecyclerView as its parent.

The patch transitions a RecyclerView as a single unit without recursively transitioning its recyclable children. The matching end traversal skips the same children.

Related issues:
- https://github.com/callstack/react-native-pager-view/issues/1005
- https://github.com/software-mansion/react-native-screens/issues/2461

Still needed as of 4.30.0: upstream's transition traversal has no RecyclerView
handling. 4.28.0's `SwipeRefreshLayout` filler fix (#4519) is a different crash
in the same traversal.

## iOS: composite secure-view content into JS-pop transition snapshots

Fixes the GrowthHack Follow button flashing to the butterfly logo during
JS-driven pops (custom back button, programmatic `goBack()`).

For a JS-driven pop, React unmounts the screen before the native dismiss
animation runs, so `RNSScreen addSnapshotToView` freezes the screen with
`snapshotViewAfterScreenUpdates:`. That is a render-server capture, and the
render server excludes `isSecureTextEntry` canvas layers from every capture -
the mechanism expo-privacy-sensitive borrows - so the Follow button is
stripped from the frozen frame and the butterfly behind it shows for the
whole pop animation. Native-first pops (swipe-back, native header back) are
unaffected because they animate the live views and never snapshot.

The exclusion flag is only consulted for layers inside the captured subtree,
so a snapshot rooted below the flagged canvas still includes the content. By
`addSnapshotToView` time the screen's children are already unmounted (only
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

Since 4.27.0 (upstream #4407), `setViewToSnapshot` is `addSnapshotToView`,
which adds the snapshot inside the screen view instead of replacing the
controller's view with it. The overlays are composited the same way; their
frames are in the screen view's coordinates, which match the snapshot's. They
are now also released when the view has already left the window and no
snapshot is taken. The 4.30.0 port hasn't been re-run against the repro.

## iOS + Android: do not dirty shadow nodes' Yoga nodes on every clone

Several component descriptors call `YogaLayoutableShadowNode::setSize()` from
`adopt()` with a size taken from native state. `adopt()` runs on every clone,
and unlike `setPadding()`, `setSize()` marks the Yoga node dirty even when the
size is unchanged.

Every commit clones the path from the changed node up to the root, and all
our content sits under `Screen`s (tab + stack). When a parent is cloned with
new children, React Native also re-clones children it no longer owns, such as
the stack's header config next to the screen content. So every commit dirtied
the root, and `RootShadowNode::layoutIfNeeded` ran `layoutTree` plus Yoga's
`roundLayoutResultsToPixelGrid`, which walks the whole tree. That includes
commits that change nothing layout-related: Reanimated's per-frame commits
(the profile header's transforms while scrolling) and ScrollView
`contentOffset` state updates on the JS thread while scrolling any feed.

The patch adds `rnscreens::yogaStyleHasSize()` in `utils/YogaSizeUtil.h`, and
a `setSizeIfChanged()` on each affected shadow node, which only calls
`setSize` when the size differs from the one already in the node's Yoga style.
A clone with new props still resets the style from props, so the size is
re-applied and the node dirtied as before. The descriptors that use it, on
both platforms:

- v4: `Screen`, `ModalScreen`, `ScreenStackHeaderConfig`
- v5 (unused by us, kept so this matches the upstream PR): `StackScreen`
  (Android only), `SplitScreen`, `FormSheetHost`, `TabsBottomAccessory`,
  `StackHeaderConfig`

On Android, `Screen`'s `adopt()` also has a branch that resets the size to
undefined while native hasn't reported a frame. Android only reports a frame
for screens in a native stack (`Screen.onLayout` checks
`container is ScreenStack`), so screens in a `ScreenContainer`, like our bottom
tabs, stay in that branch forever and were dirtied on every clone too. That
reset now goes through `setSizeIfChanged()` as well. `StyleSizeLength::points()`
maps NaN to undefined and undefined values compare equal, so once the size is
unset, later clones leave the node clean. `RNSScreenShadowNodeCommitHook`'s own
orientation-change reset calls `setSize` directly and still dirties as before.

Measured on an iOS simulator (Debug dev client, 15s scroll of a profile's
Media tab) before the patch: 2.06s of 5.8s main-thread time was
`layoutIfNeeded` under Reanimated commits (1.73s of it rounding, 0.21s of
actual layout), plus 0.88s on the JS thread under state updates.

Upstream: https://github.com/software-mansion/react-native-screens/issues/4777
(reported for Android only; repro at
https://github.com/TantiE100/rns-setsize-layout-repro). Fix PR:
https://github.com/software-mansion/react-native-screens/pull/4922 (not merged
as of 4.30.0). The C++ changes here match the PR exactly; on `main` the v4
files live under `legacy/`, but 4.30.0 still has the flat layout. Linear:
APP-3435.
