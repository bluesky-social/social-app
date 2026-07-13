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

## RCTTextLayoutManager.mm Patch - Text overflows instead of wrapping on the last line

Issue: https://github.com/react/react-native/issues/53450#issuecomment-3298157830 
Bandaid fix taken from: https://github.com/react/react-native/commit/581d643a9e59fd88f93757f80194e1efd11bd0e5
