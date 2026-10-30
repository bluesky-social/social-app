# react-native-pager-view+9.0.9.patch

Carries one local Android fix and two iOS changes. The Android part only
touches `android/src/main/java/com/reactnativepagerview/ComposePagerView.kt`.
Drop each part once a release contains it.

Upstream PRs #1182 (nested horizontal ScrollViews inside a page) and #1183
(cancel the JS touch when the pager starts dragging) were carried here until
they shipped in 9.0.9.

## Keep the pager's Compose state out of the host's saved state

Compose stores a `ComposeView`'s `rememberSaveable`
state (the pager's current page, the saved view state of page hosts) in the
view-tree `SavedStateRegistry`, which is the host Fragment's, under the key
`"SaveableStateRegistry:<view id>"`. The pager's internal `ComposeView` has no
id, so every pager shared the key `-1`. When react-native-screens destroys the
Fragment view of a covered screen, the old pager's state is saved under that
key, and a pager mounted afterwards restores it, starting on the old page and
ignoring `initialPage`.

In this app Home remounts its pager (`key={allFeeds.join(',')}`) after pinned
feeds are reordered or unpinned in My Feeds. The new pager opened on the
selected feed's old index, so the tab bar and the visible feed disagreed until
another tab was tapped.

The `ComposeView` now gets its `SavedStateRegistryOwner` from the same private
owner that already supplies its Lifecycle. Its registry starts empty and is
never saved, so nothing is persisted or restored. React owns the pager state,
so nothing is lost. A unique view id would also fix the mismatch, but every
remount would then leave an orphaned entry in the Fragment's saved state for
the rest of the session.

## iOS: yield to the navigation back gesture on the first page

Adds `ios/PagerGestureObserver.swift` and wires it up in `ios/PagerView.swift`.
Port of the behaviour our 6.8.0 patch added to the UIKit pager, adapted from
the community patch in
https://github.com/callstack/react-native-pager-view/issues/1050.

The SwiftUI pager has no gesture-delegate code at all, so react-native-screens'
full-screen back swipe (its own pan recognizer before iOS 26, the system
`interactiveContentPopGestureRecognizer` on iOS 26) loses every horizontal drag
to the pager's collection view, even on the first page. Letting the two
recognize simultaneously does not help because UIKit still hands the touch to
the scroll view, so the pan has to be refused before it begins. That decision
lives in `gestureRecognizerShouldBegin`, which UIKit only asks the scroll view
itself, hence the runtime subclass of the introspected collection view (the
same trick the library's `disableSafeArea()` uses). The pan is refused only on
page 0 of a horizontal pager, only in the back direction, and only while the
nearest navigation controller has something to pop.

iOS 26 also attaches a private `UIScrollViewPagingSwipeGestureRecognizer` to
paging scroll views. It flips a page on a quick flick even when the pan never
begins and consults the same delegate method, so the override refuses it under
the same conditions. Without that, only slow drags reached the back gesture
(verified on the iOS 26.5 simulator).

## iOS: keep the top scroll edge effect on horizontal pagers

Reverts the horizontal half of upstream PR
https://github.com/callstack/react-native-pager-view/pull/1178 (fixing
https://github.com/callstack/react-native-pager-view/issues/1177, released in
9.0.9). That PR hides the introspected collection view's `topEdgeEffect` on
every pager on iOS 26, with no way to opt out. The patch restores the 9.0.8
behaviour: all four edge effects are hidden only on vertical pagers, which
rotate the scroll view and would show the effects sideways.

On iOS 26 the Home tab sets `scrollEdgeEffects: {top: 'soft'}` with a
transparent native header (`HomeTabNavigator` in `src/Navigation.tsx`).
react-native-screens applies that to the first scroll view down the screen's
first-subview chain, which on Home is the pager's collection view. The pager
hides the effect in its own introspection callback, which runs at least as late
as the screen attaching, so the soft blur behind the Home header disappeared.

This can't be fixed from JS. react-native-screens re-applies the option only
when the screen attaches or the prop changes, and RN views do not trigger
UIKit's edge effect. Drop this part if upstream adds a prop to keep the top
edge effect.
