## ReactViewGroup.kt Patch - Fatal "Required value was null" during subview clipping on Android

Fixes Sentry issue APP-T20Q: `IllegalStateException: Required value was null` thrown by
`checkNotNull(allChildren?.get(idx))` in `updateSubviewClipStatus`, reached from
`ReactScrollView.onScrollChanged -> updateClippingRect` during an animated smooth scroll
(New Architecture, `removeClippedSubviews`).

The clipping loop in `updateClippingToRect` captures its bound once, but clipping a view
(`removeViewsInLayout`) can synchronously trigger reentrant child removal (layout-change
listeners, animation-end callbacks, Fabric mounting on the UI thread), which compacts
`allChildren` and nulls the tail mid-loop. Upstream already catches the
`IndexOutOfBoundsException` variant of this corruption with diagnostics, but the null-child
variant throws `IllegalStateException` and escapes as a fatal crash. A null entry means the
view is already detached, so we skip it and count it as clipped to keep index math aligned.

Not fixed upstream as of 0.88.0 (identical `checkNotNull`, October 2026); the sibling fix
attempt facebook/react-native#57365 for the same bookkeeping corruption (different stack)
was abandoned. Re-check when bumping React Native.

Note on build modes: every Android build compiles react-android from source
(`buildReactNativeFromSource: true` via expo-build-properties in app.config.js injects
the includeBuild/dependency-substitution block at prebuild), so this hunk, like any
ReactAndroid or ReactCommon change in this patch, is active in dev builds too. Before
that, only production builds compiled from source, and dev builds used the prebuilt AAR
from Maven Central, where these hunks have no effect.
