# react-native-pager-view+9.0.11.patch

Carries two iOS changes. Drop each one once a release
contains it.

These upstream PRs were carried here until they shipped:
- #1182 (nested horizontal ScrollViews inside a page) and #1183 (cancel the JS
  touch when the pager starts dragging), in 9.0.9.
- #1195 (iOS: yield to the navigation back gesture on the first page), in
  9.0.10.
- #1194 (keep the pager's Compose state out of the host's saved state), in
  9.0.11.

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

## iOS: detach the hosting controller when the pager leaves the window

Backport of the `didMoveToWindow` hunk of upstream PR
https://github.com/callstack/react-native-pager-view/pull/1204 (released in
10.0.0). Drop it when we upgrade to 10.x.

In 9.0.11 the pager's `UIHostingController` is added as a child of
`reactViewController()` and never removed, only re-parented. The lightbox
pager sits outside the navigation stack, so after the first lightbox open the
root view controller keeps a leaked hosting controller as its last child.

That matters because react-native-screens' status bar swizzle only delegates to
its own view controllers when one is the root's *last* child. The leak changed
which view controller UIKit asked for the status bar style for the rest of the
session (it made the JS status bar start working, and would make RNS screen
status bar options stop working). With the detach, the root's children no
longer depend on whether the lightbox has been opened.
