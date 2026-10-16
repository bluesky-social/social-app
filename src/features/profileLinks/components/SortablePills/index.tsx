import {useEffect, useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {
  GestureDetector,
  GestureStateManager,
  type PanGestureActiveEvent,
  useCompetingGestures,
  usePanGesture,
} from 'react-native-gesture-handler'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme, web} from '#/alf'
import {IS_IOS} from '#/env'
import {
  type Frame,
  GRIP_ZONE,
  HOLD_MS,
  isSameSet,
  layoutFor,
  type Point,
  rowHeightFor,
  type Size,
  type SortablePillsProps,
  TRAILING,
} from './types'

export type {SortableItem} from './types'

const SHIFT_MS = 180

/**
 * Everything that positions the row, in one shared value so a change lands
 * in one UI frame: where each pill naturally sits for the committed order
 * (`frames`), how far it is currently pushed from there (`off`), whether that
 * push should animate, and the row's height.
 */
type RowLayout = {
  frames: Record<string, Frame>
  off: Record<string, Point>
  animate: boolean
  height: number
}

/*
 * Drag-to-reorder for a wrapping row.
 *
 * The pills are positioned by hand rather than by flex: each one reports its
 * size, `layoutFor` replays the wrap layout for the current order, and every
 * pill is placed absolutely at the result. React never renders the pills in a
 * new order, so the native views are never moved in the hierarchy (which is
 * what cancels a touch on iOS and re-mounts images), and a commit is a single
 * atomic update of the positions.
 *
 * During a drag the layout is replayed on the UI thread for the live order,
 * and the pills slide to their new spots with animated offsets. The dragged
 * pill's own slot turns invisible and acts as the placeholder while a "ghost"
 * copy follows the finger. On release the ghost eases onto the placeholder,
 * then the new order is committed: the natural positions update and the
 * offsets go to zero in the same frame, so nothing moves.
 */
export function SortablePills({
  items,
  onReorder,
  onDragStateChange,
  trailing,
}: SortablePillsProps) {
  const t = useTheme()
  const {dragStart: playDragStartHaptic, selection: playSelectionHaptic} =
    useHaptics()
  const [order, setOrder] = useState<string[]>(() =>
    items.map(item => item.key),
  )
  const [activeKeyState, setActiveKeyState] = useState<string | null>(null)
  const [sizes, setSizes] = useState<Record<string, Size>>({})
  const [rowWidth, setRowWidth] = useState(0)

  /*
   * Local order wins while it's a reshuffle of the saved items (just
   * committed); the moment an item is added or removed, the saved list is the
   * truth again.
   */
  const savedOrder = items.map(item => item.key)
  /*
   * Adopt the parent's order whenever it changes, e.g. a reorder from a screen
   * reader action. Right after a drag the two already match.
   */
  const savedOrderKey = savedOrder.join('\n')
  const [syncedOrderKey, setSyncedOrderKey] = useState(savedOrderKey)
  if (syncedOrderKey !== savedOrderKey) {
    setSyncedOrderKey(savedOrderKey)
    setOrder(savedOrder)
  }
  const effectiveOrder = isSameSet(order, savedOrder) ? order : savedOrder
  /*
   * Render order is fixed (sorted by key) so a reorder never moves a child in
   * the tree; the visual order is entirely a matter of position.
   */
  const renderOrder = [...savedOrder].sort()
  const byKey = new Map(items.map(item => [item.key, item]))
  const active = activeKeyState ? byKey.get(activeKeyState) : undefined

  const layoutKeys = trailing ? [...effectiveOrder, TRAILING] : effectiveOrder
  const ready = rowWidth > 0 && layoutKeys.every(key => sizes[key] != null)

  const layout = useSharedValue<RowLayout>({
    frames: {},
    off: {},
    animate: false,
    height: 0,
  })
  const rowWidthSV = useSharedValue(0)
  const orderSV = useSharedValue<string[]>(effectiveOrder)
  const startOrder = useSharedValue<string[]>([])
  const activeKey = useSharedValue('')
  const px = useSharedValue(0)
  const py = useSharedValue(0)
  const ghostSize = useSharedValue({w: 0, h: 0})
  const settling = useSharedValue(false)

  // mirror the rendered order to the UI thread after every render
  useEffect(() => {
    orderSV.set(effectiveOrder)
  })

  /*
   * The committed layout. Set as one value so positions and offsets change
   * together; runs after a commit (offsets to zero, no motion) and whenever
   * sizes or the row width change outside a drag.
   */
  const orderKey = effectiveOrder.join('\n')
  const hasTrailing = !!trailing
  useEffect(() => {
    if (!ready || activeKeyState !== null) return
    const frames = layoutFor(orderKey.split('\n'), sizes, rowWidth, hasTrailing)
    layout.set({
      frames,
      off: {},
      animate: false,
      height: rowHeightFor(frames),
    })
    rowWidthSV.set(rowWidth)
  }, [
    ready,
    activeKeyState,
    orderKey,
    sizes,
    rowWidth,
    hasTrailing,
    layout,
    rowWidthSV,
  ])

  const onPillLayout = (key: string) => (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout
    setSizes(prev => {
      const cur = prev[key]
      if (cur && cur.w === width && cur.h === height) return prev
      return {...prev, [key]: {w: width, h: height}}
    })
  }

  const endDrag = (finalOrder: string[], initialOrder: string[]) => {
    setActiveKeyState(null)
    onDragStateChange?.(false)
    settle.setActive(false)
    setOrder(finalOrder)
    if (finalOrder.join('\n') !== initialOrder.join('\n')) {
      onReorder(finalOrder)
    }
  }

  const beginDrag = (key: string) => {
    setActiveKeyState(key)
    onDragStateChange?.(true)
    settle.setActive(true)
    playDragStartHaptic()
  }

  /*
   * Eases the ghost onto its placeholder after release. Runs per frame rather
   * than as a fixed animation because the placeholder can still be sliding
   * from the last reorder when the finger lifts.
   */
  const settle = useFrameCallback(() => {
    if (!settling.get()) return
    const key = activeKey.get()
    const {frames} = layout.get()
    const f = frames[key]
    const pos = layoutFor(orderSV.get(), frames, rowWidthSV.get(), true)[key]
    if (!f || !pos) return
    const tx = pos.x + f.w / 2
    const ty = pos.y + f.h / 2
    const x = px.get()
    const y = py.get()
    const nx = x + (tx - x) * 0.3
    const ny = y + (ty - y) * 0.3
    if (Math.abs(tx - nx) < 0.5 && Math.abs(ty - ny) < 0.5) {
      px.set(tx)
      py.set(ty)
      settling.set(false)
      activeKey.set('')
      scheduleOnRN(endDrag, orderSV.get(), startOrder.get())
    } else {
      px.set(nx)
      py.set(ny)
    }
  }, false)

  const ghostStyle = useAnimatedStyle(() => {
    const s = ghostSize.get()
    return {
      transform: [
        {translateX: px.get() - s.w / 2},
        {translateY: py.get() - s.h / 2},
        {scale: 1.06},
      ],
    }
  })

  const rowStyle = useAnimatedStyle(() => {
    const l = layout.get()
    return {
      height: withTiming(l.height, {duration: l.animate ? SHIFT_MS : 0}),
    }
  })

  return (
    <Animated.View
      onLayout={e => setRowWidth(e.nativeEvent.layout.width)}
      style={[a.relative, a.w_full, rowStyle]}>
      {renderOrder.map(key => {
        const item = byKey.get(key)
        if (!item || !item.node) return null
        return (
          <SortablePill
            key={key}
            itemKey={key}
            hidden={activeKeyState === key}
            ready={ready}
            layout={layout}
            rowWidth={rowWidthSV}
            orderSV={orderSV}
            startOrder={startOrder}
            activeKey={activeKey}
            px={px}
            py={py}
            ghostSize={ghostSize}
            settling={settling}
            onBegin={beginDrag}
            onLayout={onPillLayout(key)}
            playSelectionHaptic={playSelectionHaptic}>
            {item.node}
          </SortablePill>
        )
      })}
      {trailing ? (
        <Placed
          id={TRAILING}
          layout={layout}
          ready={ready}
          onLayout={onPillLayout(TRAILING)}>
          {trailing}
        </Placed>
      ) : null}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            a.absolute,
            {left: 0, top: 0, zIndex: 100},
            IS_IOS
              ? {
                  shadowColor: t.palette.black,
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                }
              : {elevation: 6},
            ghostStyle,
          ]}>
          {active.ghost}
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}

/**
 * The positioning half of a pill: absolutely placed at its natural frame plus
 * its current offset, both read from the shared row layout.
 */
function usePlacement(id: string, layout: SharedValue<RowLayout>) {
  return useAnimatedStyle(() => {
    const l = layout.get()
    const f = l.frames[id]
    const o = l.off[id] ?? {x: 0, y: 0}
    const duration = l.animate ? SHIFT_MS : 0
    return {
      left: f?.x ?? 0,
      top: f?.y ?? 0,
      transform: [
        {translateX: withTiming(o.x, {duration})},
        {translateY: withTiming(o.y, {duration})},
      ],
    }
  })
}

function Placed({
  id,
  layout,
  ready,
  onLayout,
  children,
}: {
  id: string
  layout: SharedValue<RowLayout>
  ready: boolean
  onLayout: (e: LayoutChangeEvent) => void
  children: React.ReactNode
}) {
  const style = usePlacement(id, layout)
  return (
    <Animated.View
      onLayout={onLayout}
      style={[a.absolute, style, !ready && {opacity: 0}]}>
      {children}
    </Animated.View>
  )
}

function SortablePill({
  itemKey,
  hidden,
  ready,
  children,
  layout,
  rowWidth,
  orderSV,
  startOrder,
  activeKey,
  px,
  py,
  ghostSize,
  settling,
  onBegin,
  onLayout,
  playSelectionHaptic,
}: {
  itemKey: string
  /** True while this pill's ghost is being dragged: it becomes the placeholder. */
  hidden: boolean
  /** False until every pill has been measured and placed. */
  ready: boolean
  children: React.ReactNode
  layout: SharedValue<RowLayout>
  rowWidth: SharedValue<number>
  orderSV: SharedValue<string[]>
  startOrder: SharedValue<string[]>
  activeKey: SharedValue<string>
  px: SharedValue<number>
  py: SharedValue<number>
  ghostSize: SharedValue<{w: number; h: number}>
  settling: SharedValue<boolean>
  onBegin: (key: string) => void
  onLayout: (e: LayoutChangeEvent) => void
  playSelectionHaptic: () => void
}) {
  const placement = usePlacement(itemKey, layout)
  const startCenter = useSharedValue<Point>({x: 0, y: 0})
  const lastSwapKey = useSharedValue('')
  const lastSwapPoint = useSharedValue<Point>({x: 0, y: 0})

  const onActivate = () => {
    'worklet'
    if (settling.get() || activeKey.get() !== '') return
    const f = layout.get().frames[itemKey]
    if (!f) return
    const cx = f.x + f.w / 2
    const cy = f.y + f.h / 2
    activeKey.set(itemKey)
    startOrder.set(orderSV.get())
    startCenter.set({x: cx, y: cy})
    ghostSize.set({w: f.w, h: f.h})
    px.set(cx)
    py.set(cy)
    lastSwapKey.set('')
    scheduleOnRN(onBegin, itemKey)
  }

  const onUpdate = (e: PanGestureActiveEvent) => {
    'worklet'
    if (activeKey.get() !== itemKey) return
    const sc = startCenter.get()
    const p = {x: sc.x + e.translationX, y: sc.y + e.translationY}
    px.set(p.x)
    py.set(p.y)

    const cur = layout.get()
    const fr = cur.frames
    const ord = orderSV.get()
    const width = rowWidth.get()
    const me = ord.indexOf(itemKey)
    if (me < 0) return

    // hit-test against where the pills are now, not where they started
    const pos = layoutFor(ord, fr, width, true)
    let target = -1
    for (let i = 0; i < ord.length; i++) {
      if (i === me) continue
      const f = fr[ord[i]]
      const at = pos[ord[i]]
      if (!f || !at) continue
      if (
        p.x >= at.x &&
        p.x <= at.x + f.w &&
        p.y >= at.y &&
        p.y <= at.y + f.h
      ) {
        target = i
        break
      }
    }
    if (target < 0) return

    const targetKey = ord[target]
    const tf = fr[targetKey]
    const tp = pos[targetKey]
    const mp = pos[itemKey]
    // same row: only swap once the finger passes the target's midpoint
    if (mp && Math.abs(tp.y - mp.y) < 1) {
      const cx = tp.x + tf.w / 2
      if (target > me && p.x < cx) return
      if (target < me && p.x > cx) return
    }
    // don't ping-pong with the pill we just swapped until the finger moves on
    const lp = lastSwapPoint.get()
    if (
      lastSwapKey.get() === targetKey &&
      Math.hypot(p.x - lp.x, p.y - lp.y) < 24
    ) {
      return
    }

    const next = ord.slice()
    next.splice(me, 1)
    next.splice(target, 0, itemKey)
    orderSV.set(next)
    lastSwapKey.set(targetKey)
    lastSwapPoint.set(p)

    // slide everything to its place in the new order; React is not involved
    const to = layoutFor(next, fr, width, true)
    const off: Record<string, Point> = {}
    for (const key of Object.keys(to)) {
      const s = fr[key]
      if (!s) continue
      off[key] = {x: to[key].x - s.x, y: to[key].y - s.y}
    }
    layout.set({frames: fr, off, animate: true, height: rowHeightFor(to)})
    scheduleOnRN(playSelectionHaptic)
  }

  const onFinalize = () => {
    'worklet'
    // fires for both release and cancel; either way, ease home
    if (activeKey.get() !== itemKey || settling.get()) return
    settling.set(true)
  }

  /*
   * Two ways in: grabbing the six-dot grip at the pill's right end starts the
   * drag at once, while a press anywhere else has to be held first so a plain
   * tap still opens the edit sheet. Both feed the same drag handlers.
   */
  const gripPan = usePanGesture({
    manualActivation: true,
    onTouchesDown: e => {
      'worklet'
      const touch = e.changedTouches[0]
      const f = layout.get().frames[itemKey]
      if (!touch || !f || touch.x < f.w - GRIP_ZONE) {
        GestureStateManager.fail(e.handlerTag)
        return
      }
      GestureStateManager.activate(e.handlerTag)
    },
    onActivate,
    onUpdate,
    onFinalize,
  })
  const holdPan = usePanGesture({
    activateAfterLongPress: HOLD_MS,
    onActivate,
    onUpdate,
    onFinalize,
  })
  const pan = useCompetingGestures(gripPan, holdPan)

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={onLayout}
        style={[
          a.absolute,
          placement,
          (hidden || !ready) && {opacity: 0},
          web({cursor: 'grab'}),
        ]}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
