# @react-native/virtualized-lists patch

## VirtualizedList.js - interior spacer above the viewport is re-estimated on every pass

**Opt-in.** Everything here is behind a new `measureInteriorSpacers` prop, and a list without
it behaves exactly as stock: the new method returns `null` before reading anything, and the
spacer falls through to the upstream expression. FlatList forwards unknown props to
VirtualizedList (`...restProps`), so it can be passed to a `FlatList`, a Reanimated
`Animated.FlatList` or our `List` (typed there, ignored on web). Only Following v2's anchored
Home Following list passes it.

Linear: APP-3152 (scoped to this section, prototype section 1) and APP-3171.

### Symptom

On a list with `maintainVisibleContentPosition` (mVCP), after a large prepend: the scroll bar
jitters, and anything reading scroll deltas sees phantom movement. On Following v2's Home
Following, after a 51-row restore prepend on an iPhone 17 (iOS 27), the list and mVCP fell
into a 2-cycle: every 60-130 ms the content height and the offset swung together by 320-529
pt, 154 corrections in one run, 99 of them mid-gesture, and in one run it carried on at rest
indefinitely. The posts themselves don't move (screenshots taken during it are identical);
the shared `MainScrollProvider` reads each swing as a drag, so the Home header flickers (16
hides across 12 scroll-up gestures).

### Cause

Three upstream behaviours combine.

1. **`_createRenderMask` always keeps cells `[0, initialNumToRender)` rendered** (the
   scroll-to-top optimisation). After a prepend that leaves a rendered block at the very top,
   the render window around the viewport further down, and a spacer between them: an interior
   spacer directly above what the reader is looking at.
2. **A spacer is sized from approximated cell metrics**: `getCellMetricsApprox(last).offset +
   length - getCellMetricsApprox(first).offset`. Cells in a spacer are unmounted, and
   `getCellMetricsApprox` answers for any cell without a frame at its current index (every
   prepended row, and every row whose index the prepend shifted) from `_averageCellLength`. So
   the interior spacer is part estimate, part measured frame.
3. **`_averageCellLength` is a running mean** that `ListMetricsAggregator.notifyCellLayout`
   recomputes whenever any cell's layout changes.

So the content above the viewport changes size whenever the estimate moves or the spacer's
region changes. The ring above is the region changing: a row mounting at the window's leading
edge shrinks the spacer by one cell and re-estimates the rest, the content comes out about
320 pt taller, mVCP moves the offset +320, from there the row is outside the window and
unmounts, the spacer is re-estimated the other way, the content shrinks, mVCP moves -320, and
it starts again.

The tail spacer is already protected from a relative of this: it's clamped to
`getHighestMeasuredCellIndex()` so the reader can't scroll into unmeasured space, "because
otherwise content will likely jump around as it renders in above the viewport", in the
upstream comment's words. The leading and interior spacers get no such treatment, though a
jump there moves content the reader is looking at.

### Fix

`_measuredInteriorSpacerSize` sizes a spacer that has rendered cells on both sides of it from
where those cells were laid out: `offset(last + 1) - (offset(first - 1) + length(first - 1))`.
That is the gap the spacer occupies, with no estimate in it. It's self-consistent (the size it
reports is the size that produced those two layouts), so once both bracketing cells are laid
out the spacer holds still until its region changes.

In the ring: when the edge row unmounts, the spacer grows by exactly the space that row and
the spacer took up, so the content height doesn't change and mVCP has nothing to correct.
When it mounts again, the new bracketing row hasn't been laid out, so that one render is
estimated (as it must be: nothing better is known), which is at most one correction for mVCP
to absorb rather than a cycle.

It declines, leaving the upstream estimate in place, when:

- `measureInteriorSpacers` isn't `true`;
- `getItemLayout` is provided (every metric is exact and the mean is never used);
- the region starts at index 0 (the leading spacer) or ends at the last item (the tail
  spacer), as there's nothing rendered on that side to measure from;
- either bracketing cell has no frame at its current index, or its frame is from before it
  was unmounted (`isMounted` is false until it's laid out again);
- the gap comes out as nothing, which means the two frames were measured either side of a
  change.

Trade-offs, accepted for the opted-in list:

- The size of unmeasured content above the viewport stays at the first estimate rather than
  drifting towards the mean as more cells are measured. It's corrected for real when the
  reader scrolls up into it and the cells render. The tail clamp makes the same trade.
- If the two bracketing cells are measured in different layout passes with a change in
  between, one render can pin a wrong gap: bounded to a single shift of the content above.

### Scope

JS only, so it ships over the air: no native rebuild. Only `Lists/VirtualizedList.js` (the
method and the one call site) and `Lists/VirtualizedListProps.js` (the prop's Flow type and
docs). TypeScript sees the prop through our `List`'s props
(`src/view/com/util/List.tsx`, `List.web.tsx`), not through the package's `.d.ts` files, to
keep this patch small.

The prototype's other three VirtualizedList fixes (the stale `pendingScrollUpdateCount`, the
first-only window clamp, and `getDerivedStateFromProps` skipping the mVCP shift on a batched
update) aren't here; they're milestone B work under APP-3152.

### Verification

Not unit tested: the file is a patched dependency, and the ring needs a native list with mVCP,
real layout passes and a large prepend, none of which jsdom has.

On device (the iOS simulator reproduces it), on Following v2's Home Following:

1. Scroll down a few screens, leave the app until a restore prepend of 40+ rows is due, come
   back and let it land.
2. Scroll up and down through the rows above the old top, and rest just below the window's
   leading edge.
3. Before: the scroll bar jitters, and logging `contentSize.height`/`contentOffset.y` shows
   them swinging together by hundreds of points every 60-130 ms, sometimes at rest. After:
   at most one correction per row mounting at the leading edge, then still.
4. Regression: any list without the prop (threads, messages, other feeds) is untouched by
   construction, but a quick scroll through one doesn't hurt.

### Upstream and removal

Not reported upstream yet. It's worth filing with a minimal repro (a list with
`initialNumToRender`, mVCP, and a prepend large enough to leave an interior spacer above the
viewport): the fix is small and the tail clamp shows the failure mode is already understood.

**TODO: Remove once upstream sizes interior spacers from measured frames, or fold it into
milestone B's VirtualizedList patch (APP-3152) if that lands first.** The patch is pinned to
0.86.3, so a React Native bump makes pnpm stop on the unused patch: re-check the ring then,
and either re-apply it to the new version or drop it.
