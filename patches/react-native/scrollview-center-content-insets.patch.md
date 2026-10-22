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
