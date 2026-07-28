# react-native-reanimated@4.3.2.patch

Backports of two merged upstream PRs:

1. PR 9901 (`LayoutAnimation.configureNext` compatibility)
2. PR 9971 (stale `settledProps` on worklet re-animation / after app resume)

## 1. Backport of PR 9901

Backport of https://github.com/software-mansion/react-native-reanimated/pull/9901
("refactor(LayoutAnimations): stop taking over UIManagerAnimationDelegate").

Reanimated's legacy `LayoutAnimationsProxy_Legacy` registered itself as the
`UIManagerAnimationDelegate` only to receive `stopSurface`. Occupying that slot
overwrites the `LayoutAnimationDriver` that React Native installs there, which
silently breaks `LayoutAnimation.configureNext` for the whole app.

The patch makes the proxy detect surface teardown itself via a
`UIManagerCommitHook` (a commit with an empty root marks the surface in
`surfacesToRemove_`), frees the animation-delegate slot, and drops final
keyframe `Update` mutations for views deleted in the same transaction (a
deterministic `configureNext` delete-animation crash found in this app).
`uiManager` moves from Android-only to shared constructor args since the hook
registration needs it on both platforms.

Only the `packages/react-native-reanimated` part of the PR is included (the
`apps/fabric-example` hunk is not part of the published package), and the
include hunk in `LayoutAnimationsProxy_Legacy.cpp` was adjusted to the 4.3.2
release sources.

## 2. Backport of PR 9971 (stale `settledProps`)

Verbatim application of
https://github.com/software-mansion/react-native-reanimated/pull/9971, the
4.3-stable cherry-pick of
https://github.com/software-mansion/react-native-reanimated/pull/9527
("Fix stale settledProps on worklet re-animation"). Fixes the Android DM
composer "phantom jump"
(https://github.com/software-mansion/react-native-reanimated/issues/9574).

Background: with `FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS`, once an
animation settles its final props are handed to JS (polled every 500 ms by
`PropsRegistryGarbageCollector`) and stored in React component state
(`settledProps`), after which the React-side snapshot becomes the sole owner
of the value.

The PR replaces `getUpdatesOlderThanTimestamp` (which evicted registry
entries on a wall-clock 1 s/2 s window) with `collectSettledUpdates`:

- `syncedTags_` / `invalidatedTags_` track which tags React already has a
  snapshot for; when a previously-synced view re-animates, its stale snapshot
  is refreshed on the next GC tick instead of waiting for the new value to
  settle.
- Eviction is no longer time-based. An entry is only evicted on the tick
  *after* it was returned to JS (once its `settledProps` commit is
  guaranteed), so a missed timer window (app backgrounded, JS thread blocked)
  can no longer destroy a settled value before it reaches React. This
  replaces the ad-hoc eviction guard an earlier version of this patch added
  on top of the pre-merge PR 9527.
- `PropsRegistryGarbageCollector` drops the separate `viewsCount` counter
  (which could desync when nested animated components unregister a tag that
  was never registered, stopping the GC interval while views remain) in favor
  of `viewsMap.size`. Only `src/` is touched, matching the PR; Metro bundles
  the app from `src/` via the package's `react-native` field, and the stale
  `lib/` copy is unreachable (the feature is native-only).
