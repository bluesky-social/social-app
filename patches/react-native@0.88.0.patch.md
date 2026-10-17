# ***This second part of this patch is load bearing, do not remove.***

## Scheduler.cpp / Scheduler.h Patch - iOS use-after-free (restored delegate invalidation guard)

Fixes Sentry issue APP-T28X: an `EXC_BAD_ACCESS` in
`Scheduler::uiManagerDidFinishTransaction` or
`Scheduler::uiManagerDidDispatchCommand` after a queued rendering update
outlives its captured raw `SchedulerDelegate` pointer.

React Native 0.86 shipped an invalidation-token guard for this
(facebook/react-native#56680) behind `enableSchedulerDelegateInvalidation`,
which was false for the stable release level used by Expo, so we overrode that
one flag in `ReactNativeFeatureFlagsOverridesOSSStable` (merged September 2,
2026, first released in 1.132.0). Builds with the override have had no APP-T28X
events: of about 3,450 events in the 90 days to October 17, 2026, all came from
1.129-1.131 except five 1.132.0 events on or before August 26, before the
override merged.

React Native 0.88 removes both the flag and the guard
(https://github.com/react/react-native/pull/58138, commit `9682967a09`).
Upstream now relies on `RuntimeScheduler_Modern::handleTaskError` clearing the
pending task and rendering-update queues before the error handler runs
(https://github.com/react/react-native/pull/56892, commit `9cbddbd478`), which
closes the path where a JS error tears the delegate down. The #58138 commit
message says one window is still open: a delegate dropped and destroyed with no
error involved never reaches `handleTaskError`, so the queued lambda still
dereferences freed memory. We don't know which path APP-T28X takes, so this
patch keeps the guard.

It restores the 0.86 implementation without the flag checks: a
`shared_ptr<atomic<bool>>` token on `Scheduler`, captured into the two deferred
rendering-update lambdas, flipped in `~Scheduler()` and when `setDelegate`
swaps the delegate. To drop it, delete the `Scheduler.cpp` and `Scheduler.h`
hunks.

**TODO: Remove after upgrading to a React Native release that closes the
no-error teardown window (the "runtime-scheduler-level shutdown signal"
#58138 mentions), or once we decide #56892's queue clearing is enough.**

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

**2. Haptic (react-native#43388).** `updateProps` writes `tintColor` pre-attach, and a tint
write on a detached control materializes the content view outside the scroll view, permanently
suppressing the trigger haptic on iOS 17.4+ (the creation-time-state story likely explains this
too, though the haptic wiring itself is not observable in logs). We used to carry a separate
fix for the Paper `RCTRefreshControl`; React Native 0.88 removed the legacy RefreshControl
files, so only this Fabric fix remains.

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

Upstream issue #43388 still open as of October 2026. Haptics cannot be verified on the simulator -
physical device only. Spinner position verified via frame logs; haptic on this variant NOT yet
device-verified.

Opened issue in RN repo: https://github.com/react/react-native/issues/57843 (still open as of
October 2026; `RCTPullToRefreshViewComponentView.mm` is unchanged between 0.86.3 and 0.88.0).

## RCTScrollViewComponentView.mm Patch - disable ScrollView recycling

Opts `RCTScrollViewComponentView` out of Fabric view recycling with
`+shouldBeRecycled` returning `NO`.

This hunk predates these notes: it was added during the New Architecture
migration (social-app commit `200b7fe26`, "disable recycling in scrollview", May
2025, shipped in #8295) without a recorded reason. A likely motivation is the
recycled-ScrollView bug where `contentInset`/`contentOffset` leaked into the
next mount (https://github.com/facebook/react-native/issues/55090, fixed in
0.87 by facebook/react-native#56832), but that is unconfirmed. Re-evaluate
before removing.

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

Note on build modes: production Android builds compile react-android from source
(`buildReactNativeFromSource: IS_PRODUCTION` via expo-build-properties in app.config.js
injects the includeBuild/dependency-substitution block at prebuild), so this hunk IS
active in production releases. Local dev builds prebuilt in a non-production env consume
the prebuilt AAR from Maven Central instead, where this hunk (like any ReactAndroid
source change) has no effect - do not expect to see the fix in a local debug build unless
you prebuild with EXPO_PUBLIC_ENV=production or add the substitution block manually.

## RCTViewComponentView.mm Patch - Hairline border strokes dropped at certain subpixel Y offsets on New Arch

Symptom: dividers built as `borderTopWidth: hairlineWidth` vanish on some screens and not
others, deterministically by the view's absolute subpixel Y. A background fill of the same
geometry always renders.

Cause: Fabric draws borders as a stretched 9-slice image. The consumer
(`RCTAddContourEffectToLayer`) hardcodes the stretchable middle as a 1pt band, which matched
the image the producer built until RN 0.81. facebook/react-native#54237 changed the image
size to `ceil(insets) + 1 + ceil(insets)` without updating that formula, so for fractional
(hairline) insets the labels no longer match the image: transparent filler is treated as a
rigid cap, and when squeezed into a one-pixel-tall layer the sampling can land on it instead
of the stroke - no line.

Fix: compute the middle from the cap insets (`size - caps`) instead of assuming 1pt.

Upstream issue: https://github.com/react/react-native/issues/58054 (repro:
https://github.com/abulenok/HairlineBorderRepro, fails identically on 0.86.0 and 0.87.0; the
1pt formula is still there in 0.88.0).

## RCTTextInputComponentView.mm Patch - reveal the caret after a multiline input grows (iOS New Arch)

Fixes ScrollView doesn't scroll up on new line in TextInput issue
https://github.com/react/react-native/issues/58517 (still open as of October 2026).

## RCTModalHostViewComponentView.mm Patch - Blank sheet when dismissing a modal with a child controller

Fixes https://github.com/bluesky-social/social-app/issues/11393: showing the iOS
Undo Typing alert while submitting a post or reply can leave an empty composer
sheet that cannot be dismissed. UIKit dismisses only the child controller when
the modal itself receives `dismissViewControllerAnimated:completion:`.

Backport of https://github.com/react/react-native/pull/58364: when a child is
presented, dismiss through the modal's presenting controller to close the
entire stack. Fall back to the modal if its presenting controller is nil, and
keep direct dismissal when there is no child.

The PR merged on September 11, 2026 as commit
`f20f857241df8ce7dba0c965f7f6748d20a48c6f`, after the 0.88 branch was cut, so
0.88.0 does not contain it.

**TODO: Remove after upgrading to React Native 0.89 (or any release containing
`f20f857241df`).**
