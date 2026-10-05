import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {
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

type Drag = {
  key: string
  pointerId: number
  /** Where inside the pill the pointer grabbed it, so the ghost stays put under the cursor. */
  grabX: number
  grabY: number
  /** Pointer position, relative to the row. */
  x: number
  y: number
}

/*
 * Web version of the drag-to-reorder row, on pointer events (the gesture
 * library is native-only here). Same design as native: the pills are placed
 * absolutely from `layoutFor` rather than by flex, and React never renders
 * them in a new order. The six-dot grip drags at once, anywhere else needs a
 * short hold first, the pill in the flow turns into a placeholder and a ghost
 * copy follows the cursor. During a drag the others slide with a CSS
 * transition; on release the order is committed and positions and offsets
 * update in the same render, so nothing moves.
 */
export function SortablePills({
  items,
  onReorder,
  onDragStateChange,
  trailing,
}: SortablePillsProps) {
  const {t: l} = useLingui()
  const [order, setOrder] = useState<string[]>(() =>
    items.map(item => item.key),
  )
  const [drag, setDrag] = useState<Drag | null>(null)
  const [sizes, setSizes] = useState<Record<string, Size>>({})
  const [rowWidth, setRowWidth] = useState(0)
  /** Offsets from the committed positions while a drag is live. */
  const [offsets, setOffsets] = useState<Record<string, Point>>({})
  /** The live order while dragging; the committed order otherwise. */
  const [liveOrder, setLiveOrder] = useState<string[] | null>(null)
  /*
   * Handlers read the drag from a ref: with the grip, pointer moves arrive in
   * the same frame as the pointer down, before React has re-rendered with the
   * new state.
   */
  const dragRef = useRef<Drag | null>(null)
  const startOrder = useRef<string[]>([])
  const liveOrderRef = useRef<string[]>([])
  const rowEl = useRef<HTMLDivElement | null>(null)
  const elements = useRef(new Map<string, HTMLElement>())
  const hold = useRef<{
    timer: ReturnType<typeof setTimeout>
    key: string
    pointerId: number
    startX: number
    startY: number
    lastX: number
    lastY: number
  } | null>(null)
  const lastSwap = useRef<{key: string; x: number; y: number} | null>(null)
  /* A drag ends with a pointerup that the browser also turns into a click;
   * this swallows that one click so the pill doesn't open its form. */
  const suppressClick = useRef(false)

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
  const renderOrder = [...savedOrder].sort()
  const byKey = new Map(items.map(item => [item.key, item]))
  const active = drag ? byKey.get(drag.key) : undefined
  const hasTrailing = !!trailing

  const layoutKeys = hasTrailing
    ? [...effectiveOrder, TRAILING]
    : effectiveOrder
  const ready = rowWidth > 0 && layoutKeys.every(key => sizes[key] != null)
  const frames = ready
    ? layoutFor(effectiveOrder, sizes, rowWidth, hasTrailing)
    : {}
  const shown = liveOrder
    ? layoutFor(liveOrder, sizes, rowWidth, hasTrailing)
    : frames
  const height = ready ? rowHeightFor(shown) : 0

  // row width, and pill sizes, from the DOM
  useLayoutEffect(() => {
    const row = rowEl.current
    if (!row) return
    const measure = () => {
      setRowWidth(row.getBoundingClientRect().width)
      setSizes(prev => {
        let next = prev
        for (const [key, el] of elements.current) {
          const r = el.getBoundingClientRect()
          const cur = next[key]
          if (!cur || cur.w !== r.width || cur.h !== r.height) {
            next = {...next, [key]: {w: r.width, h: r.height}}
          }
        }
        return next
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row)
    for (const el of elements.current.values()) ro.observe(el)
    return () => ro.disconnect()
  }, [savedOrderKey, hasTrailing])

  useEffect(() => {
    return () => {
      if (hold.current) clearTimeout(hold.current.timer)
    }
  }, [])

  const cancelHold = () => {
    if (hold.current) {
      clearTimeout(hold.current.timer)
      hold.current = null
    }
  }

  const rowPoint = (clientX: number, clientY: number): Point => {
    const r = rowEl.current?.getBoundingClientRect()
    return {x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0)}
  }

  const startDrag = (key: string, pointerId: number, x: number, y: number) => {
    const el = elements.current.get(key)
    if (!el || !ready) return
    startOrder.current = effectiveOrder
    liveOrderRef.current = effectiveOrder
    lastSwap.current = null
    const r = el.getBoundingClientRect()
    const p = rowPoint(x, y)
    const next: Drag = {
      key,
      pointerId,
      grabX: x - r.left,
      grabY: y - r.top,
      x: p.x,
      y: p.y,
    }
    dragRef.current = next
    setDrag(next)
    setLiveOrder(effectiveOrder)
    onDragStateChange?.(true)
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  const onPointerDown = (key: string) => (e: React.PointerEvent) => {
    if (dragRef.current || e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    if (e.clientX >= r.right - GRIP_ZONE) {
      e.preventDefault()
      startDrag(key, e.pointerId, e.clientX, e.clientY)
      return
    }
    cancelHold()
    const {pointerId, clientX, clientY} = e
    hold.current = {
      key,
      pointerId,
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastY: clientY,
      timer: setTimeout(() => {
        const h = hold.current
        hold.current = null
        if (h) startDrag(h.key, h.pointerId, h.lastX, h.lastY)
      }, HOLD_MS),
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const h = hold.current
    if (h && h.pointerId === e.pointerId) {
      h.lastX = e.clientX
      h.lastY = e.clientY
      // moving before the hold lands means the person is scrolling or missing
      if (Math.hypot(e.clientX - h.startX, e.clientY - h.startY) > 6) {
        cancelHold()
      }
    }
  }

  const onWindowMove = (e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    e.preventDefault()
    const p = rowPoint(e.clientX, e.clientY)
    dragRef.current = {...drag, x: p.x, y: p.y}
    setDrag(dragRef.current)

    const ord = liveOrderRef.current
    const me = ord.indexOf(drag.key)
    if (me < 0) return
    // hit-test against where the pills are now, not where they started
    const pos = layoutFor(ord, sizes, rowWidth, hasTrailing)
    let target = -1
    for (let i = 0; i < ord.length; i++) {
      if (i === me) continue
      const at = pos[ord[i]]
      if (!at) continue
      if (
        p.x >= at.x &&
        p.x <= at.x + at.w &&
        p.y >= at.y &&
        p.y <= at.y + at.h
      ) {
        target = i
        break
      }
    }
    if (target < 0) return
    const targetKey = ord[target]
    const tp = pos[targetKey]
    const mp = pos[drag.key]
    // same row: only swap once the cursor passes the target's midpoint
    if (mp && Math.abs(tp.y - mp.y) < 1) {
      const cx = tp.x + tp.w / 2
      if (target > me && p.x < cx) return
      if (target < me && p.x > cx) return
    }
    // don't ping-pong with the pill we just swapped until the cursor moves on
    const ls = lastSwap.current
    if (ls && ls.key === targetKey && Math.hypot(p.x - ls.x, p.y - ls.y) < 24) {
      return
    }
    const next = ord.slice()
    next.splice(me, 1)
    next.splice(target, 0, drag.key)
    liveOrderRef.current = next
    lastSwap.current = {key: targetKey, x: p.x, y: p.y}

    // slide everything to its place in the new order; the DOM order stays
    const to = layoutFor(next, sizes, rowWidth, hasTrailing)
    const shifted: Record<string, Point> = {}
    for (const key of Object.keys(to)) {
      const s = frames[key]
      if (!s) continue
      shifted[key] = {x: to[key].x - s.x, y: to[key].y - s.y}
    }
    setOffsets(shifted)
    setLiveOrder(next)
  }

  const onWindowUp = (e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
    suppressClick.current = true
    setTimeout(() => {
      suppressClick.current = false
    }, 0)
    dragRef.current = null
    const final = liveOrderRef.current
    /*
     * Commit the order and drop the offsets in one render: the new positions
     * put every pill where its offset had it, so nothing moves.
     */
    setOffsets({})
    setLiveOrder(null)
    setDrag(null)
    setOrder(final)
    onDragStateChange?.(false)
    if (final.join('\n') !== startOrder.current.join('\n')) {
      onReorder(final)
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (hold.current && hold.current.pointerId === e.pointerId) cancelHold()
  }

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const placement = (key: string): React.CSSProperties => {
    const f = frames[key]
    const o = offsets[key]
    return {
      position: 'absolute',
      left: f?.x ?? 0,
      top: f?.y ?? 0,
      transform: o ? `translate(${o.x}px, ${o.y}px)` : undefined,
      transition: drag ? `transform ${SHIFT_MS}ms ease-out` : 'none',
      opacity: ready ? 1 : 0,
    }
  }

  return (
    <div
      ref={rowEl}
      style={{
        position: 'relative',
        width: '100%',
        height,
        transition: drag ? `height ${SHIFT_MS}ms ease-out` : 'none',
      }}>
      {renderOrder.map(key => {
        const item = byKey.get(key)
        if (!item) return null
        const hidden = drag?.key === key
        return (
          <div
            key={key}
            ref={el => {
              if (el) elements.current.set(key, el)
              else elements.current.delete(key)
            }}
            role="group"
            aria-label={l`Reorder ${item.label}`}
            onPointerDown={onPointerDown(key)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
            style={{
              ...placement(key),
              opacity: hidden || !ready ? 0 : 1,
              cursor: drag ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
            }}>
            {item.node}
          </div>
        )
      })}
      {trailing ? (
        <div
          ref={el => {
            if (el) elements.current.set(TRAILING, el)
            else elements.current.delete(TRAILING)
          }}
          style={placement(TRAILING)}>
          {trailing}
        </div>
      ) : null}
      {drag && active ? (
        <div
          style={{
            position: 'absolute',
            left: drag.x - drag.grabX,
            top: drag.y - drag.grabY,
            zIndex: 1000,
            pointerEvents: 'none',
            borderRadius: 999,
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            transform: 'scale(1.04)',
          }}>
          {active.ghost}
        </div>
      ) : null}
    </div>
  )
}
