# react-native-reanimated@4.5.3.patch

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
`apps/fabric-example` hunk is not part of the published package), and the hunks
were rebased onto the 4.5.3 release sources.

Note that upstream's own `pullTransaction` rework in 4.5.3 (the new
`reconcileContradictedRemovals`) covers a different case - a `Create`/`Insert`
contradicting a *withheld* exit removal - and does not subsume the deleted-tag
`Update` filter here, which guards against the `LayoutAnimationDriver` final
keyframe. That driver only runs at all once this patch frees the delegate slot.
