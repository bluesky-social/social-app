# react-native-pager-view+9.0.8.patch

Carries two upstream Android changes that are not in the 9.0.8 release, one
local Android fix, and two iOS changes. The Android parts only touch
`android/src/main/java/com/reactnativepagerview/ComposePagerView.kt`. Drop each
part once a release contains it.

## Let nested horizontal ScrollViews scroll inside a page

Upstream PR https://github.com/callstack/react-native-pager-view/pull/1182
(merged 2026-10-15), fixing
https://github.com/callstack/react-native-pager-view/issues/1156.

The 9.0 Jetpack Compose pager claimed every horizontal swipe, so a React
Native horizontal `ScrollView` inside a page (feed interstitials, Explore
pills) never scrolled. When a drag crosses the touch slop along the pager
axis, the pager now hit-tests the page under the finger for a view that can
scroll in that direction and, if it finds one, asks its parent to stop
intercepting so the child keeps the touch. The same lookup replaces the old
nested-pager coordination, which only knew about other `ComposePagerView`s.

## Cancel the JS touch when the pager starts dragging

Upstream PR https://github.com/callstack/react-native-pager-view/pull/1183
(open as of 2026-10-15). It restores a behaviour the ViewPager2 host had in
8.x: once the drag crosses the touch slop, call
`NativeGestureUtil.notifyNativeGestureStarted` so React Native sends
`touchcancel` to JS. Without it a swipe that starts on a `Pressable` still
fires `onPress` on release, which in this app means swiping between feeds
from a post card can open the post. `notifyNativeGestureEnded` is sent on
`ACTION_UP`.

The notification lives in `onInterceptTouchEvent`, which Android stops
calling once a child has claimed the touch, so it only fires when the pager
itself is dragging.

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

## iOS: deliver touches to page content immediately

Same `PagerView.swift` change: sets `delaysContentTouches = false` on the
introspected collection view. React Native's own scroll views do this, and the
6.x pager did it for its page scroll view, so press feedback inside pager pages
was immediate. `UICollectionView` defaults to delaying content touches, which
made every post and button inside Home and Profile pages respond late.
