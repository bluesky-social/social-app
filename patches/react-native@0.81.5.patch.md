# ***This second part of this patch is load bearing, do not remove.***

## RefreshControl Patch - iOS 17.4 Haptic Regression

Patching `RCTRefreshControl.mm` temporarily to play an impact haptic on refresh when using iOS 17.4 or higher. Since
17.4, there has been a regression somewhere causing haptics to not play on iOS on refresh. Should monitor for an update
in the RN repo: https://github.com/facebook/react-native/issues/43388

## RefreshControl Path - ScrollForwarder

Patching `RCTRefreshControl.m` and `RCTRefreshControl.h` to add a new `forwarderBeginRefreshing` method to the class.
This method is used by `ExpoScrollForwarder` to initiate a refresh of the underlying `UIScrollView` from inside that
module.

## RCTPullToRefreshViewComponentView.mm Patch - RefreshControl initial props dropped on New Arch

**TODO: Remove after bumping React Native to 0.82+** (fixed upstream by facebook/react-native#52615, #52584
and #53231).

On Fabric, `updateProps` diffs against `_props`, but the initial-layout replay in `layoutSubviews` passes
`_props` as the new props too, so the diff is a no-op and `tintColor`/`progressViewOffset`/`title` are never
applied on mount. This hides the pull-to-refresh spinner behind the floating home header (it stays at offset
0 instead of `headerOffset`). We diff against the `oldProps` argument instead, null-guarded with default
props for the create-mutation path.

Issue: https://github.com/facebook/react-native/issues/56343

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

## RCTTextLayoutManager.mm Patch - Text overflows instead of wrapping on the last line

Issue: https://github.com/react/react-native/issues/53450#issuecomment-3298157830 
Bandaid fix taken from: https://github.com/react/react-native/commit/581d643a9e59fd88f93757f80194e1efd11bd0e5
