# ***This second part of this patch is load bearing, do not remove.***

## RefreshControl Patch - iOS 17.4 Haptic Regression

Patching `RCTRefreshControl.mm` temporarily to play an impact haptic on refresh when using iOS 17.4 or higher. Since
17.4, there has been a regression somewhere causing haptics to not play on iOS on refresh. Should monitor for an update
in the RN repo: https://github.com/facebook/react-native/issues/43388

## RCTPullToRefreshViewComponentView.mm Patch - iOS 17.4+ haptic regression and iOS 26 progressViewOffset cancellation on New Arch

Both bugs share one root cause, established by instrumented frame-logging runs on the iOS 26
simulator (Aug 2026): **writes to a detached `UIRefreshControl` are hazardous, because the
control's `_UIRefreshControlModernContentView` bakes in the state it observes at its own
creation.** Facts proven by the logs:

- `scrollView.refreshControl` assignment inserts the control and creates its content view
  **synchronously** on iOS 26 (the "UIKit inserts lazily on a later layout pass" folklore is
  false there).
- The content view can also be materialized **earlier** by a pre-attach property write (observed
  with `tintColor`) while the control is still detached.
- The content view positions itself at whatever `bounds.origin` exists at its creation and keeps
  that y forever - width tracks on later layouts, y never re-pins.

Consequences:

**1. progressViewOffset.** Stock Fabric writes the offset as a `bounds.origin` shift in
`updateProps`, pre-attach. The content view is then created (at insertion) already inside the
shifted bounds, pins to it, and cancels the shift exactly - spinner hidden behind the floating
home header (home is the only screen passing a non-zero offset). Stock RN appeared to work only
by accident: its own pre-attach `tintColor` write materialized the content view at origin 0
*before* the offset write. Possibly related upstream: react-native#54183.

**2. Haptic (react-native#43388).** The Paper fix above does not cover Fabric: `updateProps`
writes `tintColor` pre-attach, and a tint write on a detached control materializes the content
view outside the scroll view, permanently suppressing the trigger haptic on iOS 17.4+ (the
creation-time-state story likely explains this too, though the haptic wiring itself is not
observable in logs).

**The fix**: both `tintColor` and `progressViewOffset` are parked in the component view
(`_pendingTintColor` / `_pendingProgressViewOffset`, no `UIRefreshControl` subclass) and applied
only once `_refreshControl.superview` is the scroll view - by then the content view exists,
was created at origin 0, and a bounds shift lands visibly. Application points: immediately in
`_updateX` for runtime changes while attached; in `_attach` right after the assignment (insertion
is synchronous); and from `layoutSubviews` with a `setNeedsLayout` re-arm as a fallback should
insertion ever be deferred.

Supporting changes:

- `shouldBeRecycled = NO`: recycled instances get all props force-applied in `updateProps` before
  the new control is attached, which would re-trigger the pre-attach hazards; opting out keeps
  every mount on the untouched-before-attach path.
- `_updateTitle` no longer writes `attributedTitle = nil` when there is nothing to clear - even a
  nil write before attach suppresses the haptic.

History: an earlier iteration fixed the offset by porting Paper's frame-offset trick into an
`RCTHapticCompatibleRefreshControl` subclass (worked, verified on device) - replaced by the
deferral once the root cause was understood. The control's `didMoveToSuperview` appeared broken
as a tint application point in early non-rigorous testing; unproven, not disproven.

Upstream issue #43388 still open as of Aug 2026. Haptics cannot be verified on the simulator -
physical device only. Spinner position verified via frame logs; haptic on this variant NOT yet
device-verified.

Opened issue in RN repo: https://github.com/react/react-native/issues/57843

## RCTEnhancedScrollView.mm / RCTScrollViewComponentView.mm Patch - centerContent insets stale after content resize on New Arch

**TODO: Remove after bumping React Native to 0.87+** (fixed upstream by facebook/react-native#56832,
commit d50c1b5207; first shipped in 0.87.0-rc.0).

On Fabric, `centerContent` centers by computing `contentInset` in `centerContentIfNeeded`, but that
recompute only ran on `setFrame`/`didAddSubview`/`scrollViewDidZoom` - not when a state update assigns a
new `contentSize` in `updateState`. Any content that resizes after mount inside a `centerContent`
ScrollView (e.g. the lightbox image crop view getting its real aspect ratio from `onLoad` when the embed
has no aspectRatio metadata) keeps the old insets: content rests off-center and the excess inset creates
phantom scroll range, so the image can be dragged and parked off-center and the native scroll steals the
swipe-down-to-dismiss pan. The old architecture paired every `contentSize` update with re-centering in
`RCTScrollView.updateContentSizeIfNeeded`; Fabric dropped that link.

Backport of the upstream fix: `setContentSize:`/`setCenterContent:` overrides on `RCTEnhancedScrollView`
that call `centerContentIfNeeded`, plus the `updateProps` guards so the `contentInset` prop does not
fight the computed centering inset.

Issue: https://github.com/facebook/react-native/issues/55090

## RCTScrollViewComponentView.mm Patch - ScrollView pinch/pan ignored outside content area on New Arch

**TODO: Remove after bumping React Native to 0.87+** (fixed upstream by facebook/react-native#56747,
commit efcab20908; first shipped in 0.87.0-rc.0).

On Fabric, `betterHitTest` in `RCTScrollViewComponentView` deliberately skips the `_containerView`
and hit-tests its grandchildren, returning `self` (the wrapper component view) when the touch lands
inside the scroll view bounds but outside any content. UIKit only delivers touches to a gesture
recognizer when the hit view is the recognizer's view or a descendant of it, and the `UIScrollView`
is a *child* of the wrapper - so its native pinch/pan recognizers never see those touches. In the
lightbox this means pinch-to-zoom and pan-while-zoomed only respond when the fingers are over the
image itself, not over the letterbox bars above/below it. On the old architecture, default UIKit
hit-testing returns the `UIScrollView` itself for those touches, so everything works.

Backport of the upstream one-liner: return `_scrollView` instead of `self` so touches in the
content-less area are attributed to the `UIScrollView`.

Issue: https://github.com/facebook/react-native/issues/54123
PR: https://github.com/react/react-native/pull/56747

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

Not fixed upstream as of July 2026 (identical `checkNotNull` on `main`); the sibling fix
attempt facebook/react-native#57365 for the same bookkeeping corruption (different stack)
was abandoned. Re-check when bumping React Native.

Note on build modes: production Android builds compile react-android from source
(`buildReactNativeFromSource: IS_PRODUCTION` via expo-build-properties in app.config.js
injects the includeBuild/dependency-substitution block at prebuild), so this hunk IS
active in production releases. Local dev builds prebuilt in a non-production env consume
the prebuilt AAR from Maven Central instead, where this hunk (like any ReactAndroid
source change) has no effect - do not expect to see the fix in a local debug build unless
you prebuild with EXPO_PUBLIC_ENV=production or add the substitution block manually.

## RCTFontUtils.mm Patch - Custom font weights render as the heaviest face on New Arch

**TODO: Remove after bumping React Native to a release that contains facebook/react-native#57483**
(commit 918fb15bfe5f, on `main`; not in 0.86 and not yet released).

Backport of the upstream one-liner: use a real ternary so the numeric weight is returned instead of
the boolean. For a double, `(A != 0.0) ? A : B` is exactly equivalent to the original `A ?: B`.

PR: https://github.com/facebook/react-native/pull/57483

## RCTTextLayoutManager.mm Patch - Text overflows instead of wrapping on the last line

Issue: https://github.com/react/react-native/issues/53450#issuecomment-3298157830 
Bandaid fix taken from: https://github.com/react/react-native/commit/581d643a9e59fd88f93757f80194e1efd11bd0e5
