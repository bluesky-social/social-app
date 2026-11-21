/*
 * Read-only access to the private VirtualizedList state that decides whether
 * a prepend is held. None of this is public API: every field is optional and
 * every read degrades to null, so a React Native bump can only blank the
 * readout, never crash the lab.
 *
 * The one write is `queueCellsUpdate`, which calls the updater VirtualizedList
 * itself runs from every scroll event. It exists to make scenario 5
 * deterministic and patches nothing.
 */

type Window = {first: number; last: number}

type VirtualizedListLike = {
  state?: {
    cellsAroundViewport?: Window
    pendingScrollUpdateCount?: number
    firstVisibleItemKey?: string | null
  }
  _scrollMetrics?: {offset?: number}
  _listMetrics?: {getAverageCellLength?: () => number}
  _updateCellsToRender?: () => void
}

export type VLSnapshot = {
  /** `state.pendingScrollUpdateCount`: while positive the window is frozen. */
  pending: number
  /** `state.cellsAroundViewport`. */
  first: number
  last: number
  /** `state.firstVisibleItemKey`: the key at `minIndexForVisible` last time the derived-state pass ran. */
  key: string | null
  /** `_scrollMetrics.offset`: the JS-side offset, stale after a native correction until the next scroll event. */
  jsOffset: number | null
  /** The running mean every unmeasured row is estimated at. */
  avgCell: number | null
}

/** `list` is the ref of `#/view/com/util/List`, i.e. a FlatList instance. */
function getVirtualizedList(list: unknown): VirtualizedListLike | null {
  if (!list || typeof list !== 'object') return null
  const inner = (list as {_listRef?: unknown})._listRef
  if (!inner || typeof inner !== 'object') return null
  return inner
}

export function readVirtualizedList(list: unknown): VLSnapshot | null {
  const vl = getVirtualizedList(list)
  const state = vl?.state
  const window = state?.cellsAroundViewport
  if (!vl || !state || !window) return null
  const avgCell = vl._listMetrics?.getAverageCellLength?.()
  return {
    pending: state.pendingScrollUpdateCount ?? 0,
    first: window.first,
    last: window.last,
    key: state.firstVisibleItemKey ?? null,
    jsOffset: vl._scrollMetrics?.offset ?? null,
    avgCell: typeof avgCell === 'number' ? avgCell : null,
  }
}

/**
 * Queues VirtualizedList's cells-update `setState` updater. Called in the same
 * tick as a prepend, it lands in the same render, which is what happens on
 * every frame while the list is scrolling.
 */
export function queueCellsUpdate(list: unknown): boolean {
  const vl = getVirtualizedList(list)
  if (!vl || typeof vl._updateCellsToRender !== 'function') return false
  vl._updateCellsToRender()
  return true
}

/**
 * The ScrollView's content container, so rows can be measured in content
 * coordinates (`measureLayout`), independently of the scroll offset.
 */
export function getContentContainer(list: unknown): unknown {
  if (!list || typeof list !== 'object') return null
  const getScroll = (list as {getNativeScrollRef?: () => unknown})
    .getNativeScrollRef
  const scroll = typeof getScroll === 'function' ? getScroll.call(list) : null
  if (!scroll || typeof scroll !== 'object') return null
  const getInner = (scroll as {getInnerViewRef?: () => unknown}).getInnerViewRef
  return typeof getInner === 'function' ? getInner.call(scroll) : null
}
