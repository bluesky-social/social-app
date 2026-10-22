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
