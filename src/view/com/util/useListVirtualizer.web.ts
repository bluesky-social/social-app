import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'

/** Height assumed for a row until this list has measured any of its rows. */
const DEFAULT_ESTIMATED_ROW_HEIGHT = 200
/** How far past each edge of the viewport the window extends, in viewports. */
const OVERSCAN = 1.5
/**
 * The window is only moved once the viewport gets this close to one of its
 * edges, in viewports, so scrolling re-renders in chunks rather than per row.
 */
const MIN_OVERSCAN = 0.5
const HEIGHT_CACHE_LIMIT = 5000

/**
 * Measured row heights by item key, shared by every list and kept across
 * unmounts. A screen evicted from the web stack cache remounts and has its
 * window `scrollY` restored a frame later, which only lands in the right place
 * if the rows it hasn't mounted yet are already the right size.
 */
const heightCache = new Map<string, {width: number; height: number}>()

function cacheHeight(key: string, width: number, height: number) {
  heightCache.delete(key)
  heightCache.set(key, {width, height})
  if (heightCache.size > HEIGHT_CACHE_LIMIT) {
    const oldest = heightCache.keys().next().value
    if (oldest !== undefined) heightCache.delete(oldest)
  }
}

let supportsScrollAnchoring: boolean | undefined

/**
 * Whether the browser keeps content in place for us when rows above the
 * viewport change size. Safari only has scroll anchoring from 27, and some
 * screens (e.g. Profile) opt out with `overflow-anchor: none`.
 */
function hasNativeScrollAnchoring(node: HTMLElement) {
  supportsScrollAnchoring ??=
    typeof CSS !== 'undefined' && CSS.supports('overflow-anchor', 'auto')
  if (!supportsScrollAnchoring) return false
  for (let el: HTMLElement | null = node; el; el = el.parentElement) {
    if (getComputedStyle(el).overflowAnchor === 'none') return false
  }
  return true
}

/** A row is in a `display: none` tree, e.g. a hidden tab or stack screen. */
function isHidden(node: Element) {
  return node.getClientRects().length === 0
}

type Range = {start: number; end: number; startKey: string | undefined}

/**
 * Windowing for the web `List`. Renders the rows near the viewport between
 * two spacers that stand in for the rest, so the page keeps its full height.
 * Works against either the window or a scrolling container.
 */
export function useListVirtualizer({
  enabled,
  keys,
  initialNumToRender = 10,
  scrollRootRef,
  isActive,
}: {
  enabled: boolean
  keys: string[]
  initialNumToRender?: number
  /** The scrolling container, or null when the list scrolls the window. */
  scrollRootRef: React.RefObject<HTMLElement | null> | null
  /** Whether the list is visible and should follow scroll events. */
  isActive: boolean
}) {
  const itemCount = keys.length
  const markerRef = useRef<HTMLElement | null>(null)
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(() =>
    seedHeights(new Map(), keys, undefined),
  )
  /** Null until the window has been computed against the real viewport. */
  const [range, setRange] = useState<Range | null>(null)

  /*
   * The window is stored by the key of its first row, so items added above it
   * (refresh, onStartReached) shift the indices without swapping the rows.
   */
  let start = 0
  let end = Math.min(itemCount, initialNumToRender)
  if (range) {
    start = range.start
    end = range.end
    const shiftedStart =
      range.startKey === undefined ? -1 : keys.indexOf(range.startKey)
    if (shiftedStart !== -1 && shiftedStart !== start) {
      end += shiftedStart - start
      start = shiftedStart
    }
  }
  start = Math.max(0, Math.min(start, itemCount))
  end = Math.max(start, Math.min(end, itemCount))
  if (!enabled) {
    start = 0
    end = itemCount
  }

  const estimate = getEstimate(heights)
  let topSpacerHeight = 0
  let bottomSpacerHeight = 0
  if (enabled) {
    for (let i = 0; i < start; i++) {
      topSpacerHeight += heights.get(keys[i]) ?? estimate
    }
    for (let i = end; i < itemCount; i++) {
      bottomSpacerHeight += heights.get(keys[i]) ?? estimate
    }
  }

  // Latest values for the imperative code below (scroll, resize, observers).
  const keysRef = useRef(keys)
  const heightsRef = useRef(heights)
  const rangeRef = useRef({start, end})
  const enabledRef = useRef(enabled)
  const widthRef = useRef<number | undefined>(undefined)
  const keyToNodeRef = useRef(new Map<string, HTMLElement>())
  const nodeToKeyRef = useRef(new Map<Element, string>())
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const manualAnchoringRef = useRef<boolean | undefined>(undefined)
  const anchorRef = useRef<{
    key: string
    top: number
    scrollPos: number
  } | null>(null)
  const recomputeFrameRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    keysRef.current = keys
    heightsRef.current = heights
    rangeRef.current = {start, end}
    enabledRef.current = enabled
  })

  const getViewport = useCallback(() => {
    const root = scrollRootRef?.current
    if (root) {
      const rect = root.getBoundingClientRect()
      return {top: rect.top, bottom: rect.bottom, scrollPos: root.scrollTop}
    }
    return {top: 0, bottom: window.innerHeight, scrollPos: window.scrollY}
  }, [scrollRootRef])

  const getOffsets = useCallback(() => {
    const currentKeys = keysRef.current
    const currentHeights = heightsRef.current
    const fallback = getEstimate(currentHeights)
    const offsets = new Array<number>(currentKeys.length + 1)
    offsets[0] = 0
    for (let i = 0; i < currentKeys.length; i++) {
      offsets[i + 1] =
        offsets[i] + (currentHeights.get(currentKeys[i]) ?? fallback)
    }
    return offsets
  }, [])

  /*
   * Without native scroll anchoring, rows above the viewport changing size
   * (estimates being replaced by real heights, images loading) would move
   * everything on screen. Remember where the first visible row was and scroll
   * by however far it moved for reasons other than scrolling.
   */
  const maintainAnchor = useCallback(() => {
    if (!manualAnchoringRef.current) return
    const viewport = getViewport()
    const anchor = anchorRef.current
    const anchorNode = anchor && keyToNodeRef.current.get(anchor.key)
    if (
      anchor &&
      anchorNode &&
      !isHidden(anchorNode) &&
      viewport.scrollPos > 0
    ) {
      const expectedTop = anchor.top - (viewport.scrollPos - anchor.scrollPos)
      const delta = anchorNode.getBoundingClientRect().top - expectedTop
      if (Math.abs(delta) >= 1) {
        const root = scrollRootRef?.current
        if (root) {
          root.scrollBy({top: delta, behavior: 'instant'})
        } else {
          // scrollBy rather than scrollTo, which MainScrollProvider treats as a
          // scroll restoration.
          window.scrollBy({top: delta, behavior: 'instant'})
        }
      }
    }

    anchorRef.current = null
    const {start: rangeStart, end: rangeEnd} = rangeRef.current
    const currentKeys = keysRef.current
    const scrollPos = getViewport().scrollPos
    for (let i = rangeStart; i < rangeEnd; i++) {
      const node = keyToNodeRef.current.get(currentKeys[i])
      if (!node || isHidden(node)) continue
      const rect = node.getBoundingClientRect()
      if (rect.bottom > viewport.top) {
        anchorRef.current = {key: currentKeys[i], top: rect.top, scrollPos}
        return
      }
    }
  }, [getViewport, scrollRootRef])

  const recompute = useCallback(() => {
    const marker = markerRef.current
    if (!enabledRef.current || !marker || isHidden(marker)) return
    if (manualAnchoringRef.current === undefined) {
      manualAnchoringRef.current = !hasNativeScrollAnchoring(marker)
    }

    const currentKeys = keysRef.current
    const count = currentKeys.length
    const offsets = getOffsets()
    const viewport = getViewport()
    const listTop = marker.getBoundingClientRect().top
    const viewportHeight = viewport.bottom - viewport.top
    const viewTop = viewport.top - listTop
    const viewBottom = viewport.bottom - listTop

    const current = rangeRef.current
    setRange(prev => {
      if (prev) {
        const coveredTop =
          current.start === 0 ? -Infinity : offsets[current.start]
        const coveredBottom =
          current.end === count ? Infinity : offsets[current.end]
        if (
          coveredTop <= viewTop - viewportHeight * MIN_OVERSCAN &&
          coveredBottom >= viewBottom + viewportHeight * MIN_OVERSCAN
        ) {
          return prev
        }
      }
      const targetTop = viewTop - viewportHeight * OVERSCAN
      const targetBottom = viewBottom + viewportHeight * OVERSCAN
      let nextStart = 0
      while (nextStart < count && offsets[nextStart + 1] <= targetTop) {
        nextStart++
      }
      let nextEnd = nextStart
      while (nextEnd < count && offsets[nextEnd] < targetBottom) {
        nextEnd++
      }
      if (
        prev &&
        current.start === nextStart &&
        current.end === nextEnd &&
        prev.startKey === currentKeys[nextStart]
      ) {
        return prev
      }
      return {start: nextStart, end: nextEnd, startKey: currentKeys[nextStart]}
    })
  }, [getOffsets, getViewport])

  const scheduleRecompute = useCallback(() => {
    if (recomputeFrameRef.current != null) return
    recomputeFrameRef.current = requestAnimationFrame(() => {
      recomputeFrameRef.current = null
      maintainAnchor()
      recompute()
    })
  }, [maintainAnchor, recompute])

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      let next: Map<string, number> | undefined
      for (const entry of entries) {
        const key = nodeToKeyRef.current.get(entry.target)
        // Rows in a hidden tab or screen report 0px; keep what we had.
        if (key === undefined || isHidden(entry.target)) continue
        const box = entry.borderBoxSize?.[0]
        const height = box
          ? box.blockSize
          : (entry.target as HTMLElement).offsetHeight
        const width = box
          ? box.inlineSize
          : (entry.target as HTMLElement).offsetWidth
        if (widthRef.current !== undefined && widthRef.current !== width) {
          /*
           * Rows wrap differently at a new width, so heights measured at the
           * old one are wrong. Keep only those cached at this width.
           */
          next = new Map()
          for (const currentKey of keysRef.current) {
            const cached = heightCache.get(currentKey)
            if (cached?.width === width) next.set(currentKey, cached.height)
          }
        }
        widthRef.current = width
        cacheHeight(key, width, height)
        const current = next ?? heightsRef.current
        if (current.get(key) !== height) {
          if (!next) next = new Map(heightsRef.current)
          next.set(key, height)
        }
      }
      if (next) {
        heightsRef.current = next
        setHeights(next)
      }
      maintainAnchor()
      scheduleRecompute()
    },
    [maintainAnchor, scheduleRecompute],
  )

  /** Called by each mounted row so its height can be tracked. */
  const observeRow = useCallback(
    (key: string, node: HTMLElement | null) => {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(handleResize)
      }
      const resizeObserver = resizeObserverRef.current
      const previous = keyToNodeRef.current.get(key)
      if (previous && previous !== node) {
        resizeObserver.unobserve(previous)
        nodeToKeyRef.current.delete(previous)
        keyToNodeRef.current.delete(key)
      }
      if (node) {
        keyToNodeRef.current.set(key, node)
        nodeToKeyRef.current.set(node, key)
        resizeObserver.observe(node)
      }
    },
    [handleResize],
  )

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect()
      if (recomputeFrameRef.current != null) {
        cancelAnimationFrame(recomputeFrameRef.current)
      }
    }
  }, [])

  // Pick up heights measured by an earlier mount of the same rows.
  useLayoutEffect(() => {
    if (!enabled) return
    const seeded = seedHeights(heightsRef.current, keys, widthRef.current)
    if (seeded !== heightsRef.current) {
      heightsRef.current = seeded
      setHeights(seeded)
    }
  }, [enabled, keys])

  // Runs after every commit, before paint, so new rows never flash in place.
  useLayoutEffect(() => {
    if (!enabled) return
    maintainAnchor()
    recompute()
  })

  useEffect(() => {
    if (!enabled || !isActive) return
    const target = scrollRootRef?.current ?? window
    target.addEventListener('scroll', scheduleRecompute, {passive: true})
    window.addEventListener('resize', scheduleRecompute)
    scheduleRecompute()
    return () => {
      target.removeEventListener('scroll', scheduleRecompute)
      window.removeEventListener('resize', scheduleRecompute)
    }
  }, [enabled, isActive, scheduleRecompute, scrollRootRef])

  /**
   * Scroll offset that would center the row at `index` in the viewport, from
   * measured or estimated heights. For rows that aren't mounted yet.
   */
  const getScrollOffsetForIndex = useCallback(
    (index: number) => {
      const marker = markerRef.current
      if (!marker || index < 0 || index >= keysRef.current.length) return null
      const offsets = getOffsets()
      const viewport = getViewport()
      const listTopInScroll =
        viewport.scrollPos + marker.getBoundingClientRect().top - viewport.top
      const rowCenter = (offsets[index] + offsets[index + 1]) / 2
      return Math.max(
        0,
        listTopInScroll + rowCenter - (viewport.bottom - viewport.top) / 2,
      )
    },
    [getOffsets, getViewport],
  )

  return {
    start,
    end,
    topSpacerHeight,
    bottomSpacerHeight,
    markerRef,
    observeRow: enabled ? observeRow : undefined,
    getScrollOffsetForIndex,
  }
}

function getEstimate(heights: ReadonlyMap<string, number>) {
  if (heights.size === 0) return DEFAULT_ESTIMATED_ROW_HEIGHT
  let total = 0
  for (const height of heights.values()) total += height
  return total / heights.size
}

/**
 * Adds cached heights for keys this list hasn't measured. Returns the same map
 * if there was nothing to add.
 */
function seedHeights(
  heights: ReadonlyMap<string, number>,
  keys: string[],
  width: number | undefined,
): ReadonlyMap<string, number> {
  let next: Map<string, number> | undefined
  for (const key of keys) {
    if (heights.has(key)) continue
    const cached = heightCache.get(key)
    if (!cached || (width !== undefined && cached.width !== width)) continue
    next ??= new Map(heights)
    next.set(key, cached.height)
  }
  return next ?? heights
}
