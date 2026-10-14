# @react-native/virtualized-lists patch

## VirtualizedList.js - a prepend that renders together with a cells update is ignored

Applies to every list with `maintainVisibleContentPosition` (mVCP). A list without it behaves
exactly as stock.

Linear: APP-3152.

### Symptom

A prepend to an mVCP list sometimes loses the reader's place. On iOS the list teleports into
the new rows, and on Android they push the content down. It happens when the prepend lands
in the same render as one of VirtualizedList's own cells updates. That's most likely when the
data is updated from a scroll event while the list is moving: in the repro, 2-3 of 40
prepends issued from `onScroll` during a scroll were missed.

### Cause

`getDerivedStateFromProps` decides whether `data` changed by comparing the new item count
with `prevState.renderMask.numCells()`, and returns early when they match. But React runs
queued `setState` updaters before `getDerivedStateFromProps`, and `_updateCellsToRender`
rebuilds `renderMask` from the new props. When it runs in the same render as the data change,
the mask already has the new count. The early return then skips everything the prepend needs:

- the render window isn't shifted;
- `pendingScrollUpdateCount` isn't set;
- `firstVisibleItemKey` stays stale.

If the prepend is bigger than what the window holds below the anchor, the anchor is unmounted
in the same commit, and native mVCP has nothing to correct against.

### Fix

Read the key at `minIndexForVisible` before the early return. On mVCP lists, return early only
when both the count and the key are unchanged. This is the change in the upstream PR below,
applied to 0.86.3.

### Scope

Global for mVCP lists: Following v2's Home Following, `MessagesList` (loading older messages)
and `PostThread` (parents loading above). For those lists, an equal-count change to the first
item now runs the existing derived-state pass instead of being skipped. That pass finds no
anchor to adjust for, and refreshes the stale `firstVisibleItemKey`.

### Upstream and removal

- Issue: https://github.com/react/react-native/issues/58909
- PR: https://github.com/react/react-native/pull/58911, with a regression test
- Standalone repro (RN 0.87.1, iOS and Android, with a stock/fixed switch and demo videos):
  https://github.com/mozzius/virtualizedlist-batched-prepend-repro

**TODO: Remove once #58911 ships in a React Native release we're on.** The patch is pinned to
0.86.3, so a React Native bump makes pnpm stop on the unused patch. Drop it then if the new
version has the fix, otherwise re-apply it.

## VirtualizedList.js - an interior spacer rescales as rows are measured

Applies to every virtualized list. It only changes the size of a spacer that has rendered
cells on both sides of it.

Linear: APP-3152.

### Symptom

After a large prepend to a list with `maintainVisibleContentPosition`, the list and mVCP can
fall into a cycle that never settles. Every ~67 ms the content height and the offset swing
together by about 400 pt and back. The rows on screen don't move, because mVCP compensates
exactly. But the scroll bar jitters, `onScroll` reports constant phantom movement, and anything
driven by it (the Home header) reacts. In the repro it rings 75 times in 5 s at rest.

### Cause

`_createRenderMask` always keeps cells `[0, initialNumToRender)` rendered. After a prepend that
leaves a spacer between that head block and the render window, directly above the viewport. A
spacer is sized from `getCellMetricsApprox` at both ends, and for an unmeasured cell that is
`_averageCellLength * index`, which ignores where the rendered head cells actually end. So the
spacer's start is an estimate. It moves whenever the average changes or a cell mounts or
unmounts at the window's edge, moving every cell after it, and mVCP chases it.

### Fix

When a spacer's first cell is unmeasured, start the spacer where the rendered cell before it
ends. Only the start is anchored: sizing it from the cell after it as well would include any
`gap` or cell margin between them, which then feeds back into the spacer every render. When
the spacer's last cell is unmeasured, its size still follows the average, as on stock. That
gives occasional one-off corrections rather than a cycle.

Results in the repro (iOS, 4 runs each; jumps after the prepend / while nudging / 5 s at rest):
stock 3 / 6 / 75, with the fix 2 / 1 / 0. Also stable with `contentContainerStyle={{gap: 10}}`.

### Upstream and removal

- Issue: https://github.com/react/react-native/issues/58870
- PR: https://github.com/react/react-native/pull/58916, with a regression test
- Standalone repro (RN 0.87.1): https://github.com/mozzius/virtualizedlist-spacer-ring-repro

**TODO: Remove once #58916 ships in a React Native release we're on.**

## VirtualizedList.js - the window is recomputed from a scroll offset native hasn't corrected yet

Applies to every list with `maintainVisibleContentPosition` that doesn't use `getItemLayout`.

Linear: APP-3152.

### Symptom

After a large prepend above a restored position, the row the reader was on is unmounted and the
list jumps. In the repro (scrolled to y=2500, 100 tall rows prepended) it happened in 26 of 40
runs.

### Cause

On the New Architecture, a commit's `onLayout` events reach VirtualizedList before the commit is
mounted. Native mVCP corrects the scroll offset at mount, and the scroll event reporting it comes
after. A cells update in between combines the old `_scrollMetrics.offset` with the new cell
positions, so it computes the window for a viewport too high by the size of the shift. If the
shift is big, the window skips the visible row and unmounts mVCP's anchor. VirtualizedList
already waits for the correction after a prepend (`pendingScrollUpdateCount`), but not when the
anchor moves for any other reason: a spacer re-estimated, rows mounting above the viewport, a
header resizing.

### Fix

When the layout of the cell mVCP is anchored on (a mounted cell across the start of the
viewport) changes its offset, set `_pendingAnchorCorrection`, and don't recompute the window
until the next scroll event clears it. It's an instance field rather than state, so cells updates
already queued by earlier layout events in the same batch see it. It never grows the window, it
only defers a recompute. Ported from the upstream PR with two changes for 0.86.3: the
horizontal-RTL check is inlined (`_isHorizontalRTL` doesn't exist yet), and `_onScroll` keeps
0.86.3's decrement of `pendingScrollUpdateCount`.

Repro on iOS: stock lost the reader's row in 26/40 runs, fixed 0/40.

### Upstream and removal

- Issue: https://github.com/react/react-native/issues/58921
- PR: https://github.com/react/react-native/pull/58922, with a regression test
- Standalone repro (RN 0.87.1): https://github.com/mozzius/virtualizedlist-mvcp-stale-offset-repro

**TODO: Remove once #58922 ships in a React Native release we're on.**

