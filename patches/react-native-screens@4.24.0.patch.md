# react-native-screens+4.24.0.patch

## Android: do not transition RecyclerView children individually

Fixes `Scrapped or attached views may not be recycled` when leaving a screen while a nested ViewPager2 is still settling.

When a screen removal starts, react-native-screens recursively calls `startViewTransition()` on every descendant. Android intentionally keeps a transitioning view's `parent` set after it is removed so that the parent can continue drawing it until `endViewTransition()`.

This violates RecyclerView's requirement that a ViewHolder be fully detached before recycling: if ViewPager2 recycles a page during the screen transition, the holder has been removed from RecyclerView's child array but still reports RecyclerView as its parent.

The patch transitions a RecyclerView as a single unit without recursively transitioning its recyclable children. The matching end traversal skips the same children.

Related issues:
- https://github.com/callstack/react-native-pager-view/issues/1005
- https://github.com/software-mansion/react-native-screens/issues/2461
