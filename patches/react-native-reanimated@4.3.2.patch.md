# react-native-reanimated@4.3.2.patch

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
