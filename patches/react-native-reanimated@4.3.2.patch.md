# react-native-reanimated@4.3.2.patch

Contains two independent changes:

1. Backport of PR 9901 (`LayoutAnimation.configureNext` compatibility)
2. Backport of PR 9527 plus an eviction guard in `AnimatedPropsRegistry`
   (stale `settledProps` applied after app resume)

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

## 2. Stale `settledProps` after app resume (AnimatedPropsRegistry)

Backport of https://github.com/software-mansion/react-native-reanimated/pull/9527
("Fix stale settledProps on worklet re-animation") plus an additional eviction
guard on top of it. Fixes the Android DM composer "phantom jump"
(https://github.com/software-mansion/react-native-reanimated/issues/9574).

Background: with `FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS`, once an
animation settles its final props are handed to JS (polled every 500 ms by
`PropsRegistryGarbageCollector`) and stored in React component state
(`settledProps`). The native registry entry is then evicted ~2 s after the
last worklet write, at which point `ReanimatedCommitHook` no longer covers the
view and the React-side snapshot becomes the sole owner of the value.

The PR 9527 part adds `syncedTags_` / `invalidatedTags_` so that when a
previously-synced view re-animates, its now-stale React snapshot is refreshed
on the next GC tick instead of waiting up to ~1.5 s for the new value to
settle.

The additional guard fixes the handoff itself. Upstream, eviction relies on a
timing assumption: the settled value is returnable between 1 s and 2 s of age,
and a 500 ms JS timer is assumed to tick inside that window. If no tick lands
there (app backgrounded while a keyboard-driven animation finishes, JS thread
blocked for >1 s), the first tick after resume destroys the entry inside
`getUpdatesOlderThanTimestamp` *before* the collection loop can return it -
the settled value is lost, React state keeps the pre-background value, and the
next React commit snaps the view back (the phantom jump). The guard makes
`removeUpdatesOlderThanTimestamp` only evict tags present in `syncedTags_`,
i.e. values that were actually handed to JS; an unsynced stale entry survives
one more tick, gets returned as settled, and is evicted on the following tick.
