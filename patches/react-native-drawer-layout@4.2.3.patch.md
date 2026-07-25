# react-native-drawer-layout@4.2.3.patch

Backport of the current upstream `toggleDrawer` from
[`react-native-drawer-layout`](https://github.com/react-navigation/react-navigation/blob/main/packages/react-native-drawer-layout/src/views/Drawer.native.tsx).
None of it is released on the 4.x line (4.2.9 is latest and still lacks all of
it); upstream only ships it on the `5.0.0-alpha` line, which needs Gesture
Handler 3 and therefore react-native 0.82+. The patch can be dropped when we
move to drawer-layout 5.x.

The patch has three parts. The first landed in #8952; the other two were added
when the New Architecture switch (#10980) brought Reanimated 4 with it.

## 1. Deduplicate `toggleDrawer` calls (`animatingTo`)

`toggleDrawer` fires twice for a single swipe: once when the gesture ends, and
again from the effect that watches the `open` prop, because ending the gesture
calls `onOpen`/`onClose` which updates our shell state. The second call
restarts the spring from the current position with no velocity, which reads as
a stutter mid-animation.

`animatingTo` records which direction is in flight and the second call returns
early. Fixes the drawer jitter investigated in #8947 and #8949.

## 2. Ignore release velocity that opposes the spring direction

Reanimated 4 rewrote spring termination. With `overshootClamping: true` (which
this library always passes), the animation now ends as soon as the position
leaves the corridor between its start and its target:

```js
const leftBound = startValue >= 0 ? toValue : toValue + startValue
const rightBound = leftBound + Math.abs(startValue)
if (current < leftBound || current > rightBound) {
  return true // terminating
}
```

Reanimated 3 only treated *crossing* the target as overshoot, so a spring that
first moved away from its target (which is what an initial velocity pointing
the other way produces) was left to swing back on its own.

The consequence on Reanimated 4 is that any release whose velocity opposes the
direction the drawer settles in ends the spring on its first frame, so the
drawer teleports instead of animating. Both cases are easy to hit: an aborted
drag under `swipeMinDistance`/`swipeMinVelocity`, where `nextOpen` keeps its
current value while the finger was moving the other way, and dragging the
already-open drawer further past its edge before releasing.

Zeroing the opposing velocity keeps the animation inside the corridor. Real
flings, whose velocity agrees with the target, are passed through untouched.

## 3. `useLayoutEffect` for the `open` prop

Upstream moved the effect that calls `toggleDrawer(open)` off `useEffect`, so
the follow-up call described in part 1 happens in the same commit rather than a
frame later. Part 1 dedupes it either way, but the dedupe window is only as
long as the spring runs, so not depending on that is worth the one-line change.

## Notes

`restDisplacementThreshold` and `restSpeedThreshold` are left in the spring
config, but they are inert on Reanimated 4 - it settles on a relative
`energyThreshold` instead, and those two options survive only as no-op layout
animation builder methods. The drawer animation is roughly 200ms shorter than
it was on Reanimated 3 as a result. The spring itself is deliberately left at
this library's `stiffness: 1000, damping: 500, mass: 3`; upstream has since
retuned it to an underdamped `500/40/1`, which would change how the drawer
feels and is a separate decision.
