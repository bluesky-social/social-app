# react-native-pager-view+6.8.0.patch

Adds support for iOS 26's `interactiveContentPopGestureRecognizer` (full-screen back gesture).

The pager already handles `RNSPanGestureRecognizer` (react-native-screens' custom full-screen gesture for pre-iOS 26) in `shouldRecognizeSimultaneouslyWithGestureRecognizer:`. It checks if the user is on the leftmost page and swiping right - if so, it disables the scrollview's pan gesture to let the back gesture through.

This patch adds the same logic for iOS 26's native `interactiveContentPopGestureRecognizer`, so the back gesture works on the leftmost page while the pager still handles swipes on other pages.

The fix is applied to both implementations: `ios/RNCPagerView.m` (Paper) and `ios/Fabric/RNCPagerViewComponentView.mm` (New Architecture). The Fabric variant finds the navigation controller via the responder chain (there is no `reactViewController` helper imported there) and reads `scrollEnabled` from the Fabric props.

Related issues:
- https://github.com/software-mansion/react-native-screens/issues/3512
- https://github.com/software-mansion/react-native-screens/pull/3420

---

Also embeds the Fabric `UIPageViewController` into the view controller hierarchy (`ios/Fabric/RNCPagerViewComponentView.mm`).

The Paper implementation calls `reactAddControllerToClosestParent:` when embedding its `UIPageViewController`, so the controller becomes a child of the nearest ancestor view controller (e.g. `RNSScreen`). The Fabric implementation never does this - the page view controller is orphaned (`parentViewController == nil`).

UIKit resolves the status-bar-tap scroll-to-top gesture by walking `parentViewController`/`presentingViewController` from each candidate scroll view's nearest view controller up to the window's root (see `-[UIWindow _scrollToTopViewsUnderScreenPointIfNecessary:resultHandler:]`). With the orphaned controller that walk dead-ends, so every scroll view rendered inside a pager (all Home feeds, Profile tabs, etc.) is dropped from candidate selection and tapping the status bar no longer scrolls feeds to top. It only kept "working" when the window happened to contain exactly one other eligible scroll view, via UIKit's single-candidate fallback.

The patch attaches the page view controller to the nearest view controller found via the responder chain on `didMoveToWindow` (with a `layoutSubviews` retry because the ancestor controller may not be wired up on the first pass - same timing issue as callstack/react-native-pager-view#1089), and detaches it in `prepareForRecycle` to avoid leaking the controller after unmount.

Fixed upstream in v8 by the SwiftUI rewrite, which embeds via `reactViewController()` + `addChild` (see `PagerViewProvider.swift`).
