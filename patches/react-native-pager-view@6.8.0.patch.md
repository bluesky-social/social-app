# react-native-pager-view+6.8.0.patch

Adds support for iOS 26's `interactiveContentPopGestureRecognizer` (full-screen back gesture).

The pager already handles `RNSPanGestureRecognizer` (react-native-screens' custom full-screen gesture for pre-iOS 26) in `shouldRecognizeSimultaneouslyWithGestureRecognizer:`. It checks if the user is on the leftmost page and swiping right - if so, it disables the scrollview's pan gesture to let the back gesture through.

This patch adds the same logic for iOS 26's native `interactiveContentPopGestureRecognizer`, so the back gesture works on the leftmost page while the pager still handles swipes on other pages.

Related issues:
- https://github.com/software-mansion/react-native-screens/issues/3512
- https://github.com/software-mansion/react-native-screens/pull/3420
