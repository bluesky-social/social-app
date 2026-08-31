# react-native-screens+4.26.2.patch

## Android: do not transition RecyclerView children individually

Fixes `Scrapped or attached views may not be recycled` when leaving a screen while a nested ViewPager2 is still settling.

When a screen removal starts, react-native-screens recursively calls `startViewTransition()` on every descendant. Android intentionally keeps a transitioning view's `parent` set after it is removed so that the parent can continue drawing it until `endViewTransition()`.

This violates RecyclerView's requirement that a ViewHolder be fully detached before recycling: if ViewPager2 recycles a page during the screen transition, the holder has been removed from RecyclerView's child array but still reports RecyclerView as its parent.

The patch transitions a RecyclerView as a single unit without recursively transitioning its recyclable children. The matching end traversal skips the same children.

Related issues:
- https://github.com/callstack/react-native-pager-view/issues/1005
- https://github.com/software-mansion/react-native-screens/issues/2461

## Android 8.1: ignore detached legacy-animation draws

Fixes a framework `NullPointerException` in `View.applyLegacyAnimation` when opening a post on Android 8.1.

`ScreenStack` defers child drawing so it can reorder disappearing screens. A child can be detached between the original `drawChild()` call and the deferred draw. Android 8.1 can then dereference cleared attachment state while applying that child's legacy animation.

The patch ignores only the known framework crash when all of these conditions hold:

- the device is running Android 8.1;
- the child is no longer attached to a window; and
- the top exception frame is `android.view.View.applyLegacyAnimation`.

All other `NullPointerException`s are rethrown.

Related issues:
- APP-2982
- https://blueskyweb.sentry.io/issues/APP-T4Z8
