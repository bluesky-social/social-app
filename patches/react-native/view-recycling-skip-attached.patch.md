## ViewManager.java Patch - don't recycle a view that still has a parent

Fixes `addViewAt: failed to insert view [X] into parent [Y]`, caused by "The
specified child already has a parent", with native view recycling turned on
(`enableViewRecycling`, see `pr-59047-6f73542a45.patch.md`). Without this patch
it crashes every time on Settings, then "Add another account", then "Sign in",
and sometimes when you open a screen soon after going back from another one.

When react-native-screens removes a stack screen, it calls
`ViewGroup.startViewTransition` on every view inside it, before the mount
transaction that removes them runs. Android keeps a transitioning view drawn
after `removeView`: the view leaves its parent's children but keeps its parent
until `endViewTransition`. react-native-screens ends the transition by walking
the screen's children, which Fabric has already removed by then, so it never
ends them.

Fabric then deletes those views, and `ViewManager.onDropViewInstance` puts them
in the recycle pool with their old parent still set. When one is reused,
`createViewInstance`, `ReactViewGroup.recycleView` and
`SurfaceMountingManager.addViewAt` all call `parent.removeView(view)`, which
does nothing for a view that isn't among its parent's children, so `addView`
throws.

The patch keeps a view out of the pool if it still has a parent when it is
dropped. Fabric removes every view before deleting it, so a dropped view only
has a parent if that parent kept it through the removal. Views that were
detached normally, like list cells and conditional content, are still
recycled. The patch also leaves a screen that is animating out alone, since
`prepareToRecycleView` would otherwise reset views that are still being drawn.

https://github.com/react/react-native/pull/59776 (backported in
`pr-59776-45152f1f85.patch`) makes `addViewAt` call `endViewTransition` on a
stale parent, but that doesn't help here. `endViewTransition` only clears a
view's parent while the view is still in the parent's disappearing children,
and a `ViewGroup` empties that list without clearing the parent in
`dispatchDetachedFromWindow`. By the time a pooled view is reused, the screen it
came from has usually left the window, so its parent stays set for good. With
#59776 and without this patch, the Add another account repro still crashed 3
times out of 3.

react-native-screens' half of the bug is
https://github.com/software-mansion/react-native-screens/issues/3249, with a
fix in https://github.com/software-mansion/react-native-screens/pull/3250
(still open).

Upstream issue: https://github.com/react/react-native/issues/59863, with a
core-only repro on a nightly that includes #59776:
https://github.com/mozzius/view-recycling-transition-repro.

**TODO: Remove when https://github.com/react/react-native/issues/59863 is fixed
in a release we're on.**
