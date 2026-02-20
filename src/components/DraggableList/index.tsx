import React, {useLayoutEffect, useRef} from 'react'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  type AnimatedRef,
  measure,
  runOnJS,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme, web} from '#/alf'
import {DotGrid2x3_Stroke2_Corner0_Rounded as GripIcon} from '#/components/icons/DotGrid'

/**
 * Drag-to-reorder list. Items are absolutely positioned in a fixed-height
 * container and animated via Reanimated shared values on the UI thread.
 *
 * All positioning is driven by a `slots` map (key → index) and translateY
 * (no discrete `top` changes). On drag end the new slot assignment is
 * computed on the UI thread first, then React state is updated via runOnJS.
 *
 * See SortableList.web.tsx for the web implementation using pointer events.
 */

interface SortableListProps<T> {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode
  onReorder: (data: T[]) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  /** Fixed row height used for position math. */
  itemHeight: number
  /** Ref to the parent Animated.ScrollView for auto-scroll. */
  scrollRef?: AnimatedRef<Animated.ScrollView>
  /** Scroll offset shared value from useScrollViewOffset. */
  scrollOffset?: SharedValue<number>
}

const AUTO_SCROLL_THRESHOLD = 50
const AUTO_SCROLL_SPEED = 4

/**
 * Bundled into a single shared value so all fields update atomically
 * in one set() call on the UI thread.
 */
interface DragState {
  /** Maps each item key to its current slot index. */
  slots: Record<string, number>
  /** Key of the item being dragged, or '' when idle. */
  activeKey: string
  /** Slot the active item started in. */
  dragStartSlot: number
}

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
  itemHeight,
  scrollRef,
  scrollOffset,
}: SortableListProps<T>) {
  const state = useSharedValue<DragState>({
    slots: Object.fromEntries(data.map((item, i) => [keyExtractor(item), i])),
    activeKey: '',
    dragStartSlot: -1,
  })
  const dragY = useSharedValue(0)

  // Auto-scroll shared values
  const scrollCompensation = useSharedValue(0)
  const isGestureActive = useSharedValue(false)
  // We track scroll position ourselves because scrollOffset.get() lags
  // by one frame after scrollTo(), causing a feedback loop where the
  // frame callback keeps thinking the item is at the edge.
  const trackedScrollY = useSharedValue(0)

  // For measuring list position within scroll content
  const listRef = useAnimatedRef<Animated.View>()
  const listContentOffset = useSharedValue(0)
  const viewportHeight = useSharedValue(0)
  const measureDone = useSharedValue(false)

  // Sync slots when data changes externally (e.g. pin/unpin).
  // Skip after our own reorder — the worklet already set correct slots
  // on the UI thread, and a redundant JS-side set() would be wasteful.
  const skipNextSync = useRef(false)
  const currentKeys = data.map(item => keyExtractor(item)).join(',')
  useLayoutEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    const nextSlots: Record<string, number> = {}
    data.forEach((item, i) => {
      nextSlots[keyExtractor(item)] = i
    })
    state.set({slots: nextSlots, activeKey: '', dragStartSlot: -1})
    dragY.set(0)
  }, [currentKeys, data, keyExtractor, state, dragY])

  const handleReorder = (sortedKeys: string[]) => {
    skipNextSync.current = true
    const byKey = new Map(data.map(item => [keyExtractor(item), item]))
    onReorder(sortedKeys.map(key => byKey.get(key)!))
    onDragEnd?.()
  }

  // Auto-scroll: runs every frame while a gesture is active.
  useFrameCallback(() => {
    if (!isGestureActive.get()) return
    if (!scrollRef || !scrollOffset) return

    const s = state.get()
    if (s.activeKey === '') return

    // Measure list and scroll view on first frame of drag.
    // Use scrollOffset here (only once) since no lag has occurred yet.
    if (!measureDone.get()) {
      const scrollM = measure(
        scrollRef as unknown as AnimatedRef<Animated.View>,
      )
      const listM = measure(listRef)
      if (!scrollM || !listM) return
      trackedScrollY.set(scrollOffset.get())
      listContentOffset.set(listM.pageY - scrollM.pageY + trackedScrollY.get())
      viewportHeight.set(scrollM.height)
      measureDone.set(true)
    }

    const startSlot = s.dragStartSlot
    const currentDragY = dragY.get()

    // Use trackedScrollY (not scrollOffset) to avoid the one-frame lag
    // after scrollTo() that causes a feedback loop.
    const scrollY = trackedScrollY.get()

    // Item position relative to scroll viewport top.
    const itemContentY =
      listContentOffset.get() + startSlot * itemHeight + currentDragY
    const itemViewportY = itemContentY - scrollY
    const itemBottomViewportY = itemViewportY + itemHeight

    let scrollDelta = 0
    if (itemViewportY < AUTO_SCROLL_THRESHOLD) {
      scrollDelta = -AUTO_SCROLL_SPEED
    } else if (
      itemBottomViewportY >
      viewportHeight.get() - AUTO_SCROLL_THRESHOLD
    ) {
      scrollDelta = AUTO_SCROLL_SPEED
    }

    if (scrollDelta === 0) return

    // Don't scroll if the item is already at a list boundary.
    const effectiveSlotPos =
      (startSlot * itemHeight + currentDragY) / itemHeight
    if (scrollDelta < 0 && effectiveSlotPos <= 0) return
    if (scrollDelta > 0 && effectiveSlotPos >= data.length - 1) return

    // Don't scroll past the top.
    if (scrollDelta < 0 && scrollY <= 0) return

    const newScrollY = Math.max(0, scrollY + scrollDelta)
    scrollTo(scrollRef, 0, newScrollY, false)
    trackedScrollY.set(newScrollY)
    scrollCompensation.set(scrollCompensation.get() + (newScrollY - scrollY))
  })

  // Render in stable key order so React never reorders native views.
  // On Android, native ViewGroup child reordering causes a visual flash.
  const sortedData = [...data].sort((a, b) => {
    const ka = keyExtractor(a)
    const kb = keyExtractor(b)
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })

  return (
    <Animated.View ref={listRef} style={{height: data.length * itemHeight}}>
      {sortedData.map(item => {
        const key = keyExtractor(item)
        return (
          <SortableItem
            key={key}
            item={item}
            itemKey={key}
            itemCount={data.length}
            itemHeight={itemHeight}
            state={state}
            dragY={dragY}
            scrollCompensation={scrollCompensation}
            isGestureActive={isGestureActive}
            measureDone={measureDone}
            renderItem={renderItem}
            onCommitReorder={handleReorder}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        )
      })}
    </Animated.View>
  )
}

function SortableItem<T>({
  item,
  itemKey,
  itemCount,
  itemHeight,
  state,
  dragY,
  scrollCompensation,
  isGestureActive,
  measureDone,
  renderItem,
  onCommitReorder,
  onDragStart,
  onDragEnd,
}: {
  item: T
  itemKey: string
  itemCount: number
  itemHeight: number
  state: Animated.SharedValue<DragState>
  dragY: Animated.SharedValue<number>
  scrollCompensation: SharedValue<number>
  isGestureActive: SharedValue<boolean>
  measureDone: SharedValue<boolean>
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode
  onCommitReorder: (sortedKeys: string[]) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const t = useTheme()
  const playHaptic = useHaptics()

  const gesture = Gesture.Pan()
    .onStart(() => {
      'worklet'
      const s = state.get()
      const mySlot = s.slots[itemKey]
      state.set({...s, activeKey: itemKey, dragStartSlot: mySlot})
      dragY.set(0)
      scrollCompensation.set(0)
      isGestureActive.set(true)
      measureDone.set(false)
      if (onDragStart) {
        runOnJS(onDragStart)()
      }
      runOnJS(playHaptic)()
    })
    .onChange(e => {
      'worklet'
      const startSlot = state.get().dragStartSlot
      const minY = -startSlot * itemHeight
      const maxY = (itemCount - 1 - startSlot) * itemHeight
      // Include scroll compensation so the item tracks with auto-scroll.
      const effectiveY = e.translationY + scrollCompensation.get()
      dragY.set(Math.max(minY, Math.min(effectiveY, maxY)))
    })
    .onEnd(() => {
      'worklet'
      // Stop auto-scroll BEFORE the snap animation.
      isGestureActive.set(false)
      const startSlot = state.get().dragStartSlot
      const rawNewSlot = Math.round(
        (startSlot * itemHeight + dragY.get()) / itemHeight,
      )
      const newSlot = Math.max(0, Math.min(rawNewSlot, itemCount - 1))
      const snapOffset = (newSlot - startSlot) * itemHeight

      // Animate to the target slot, then commit.
      dragY.set(
        withTiming(snapOffset, {duration: 200}, finished => {
          if (finished) {
            if (newSlot !== startSlot) {
              // Compute new slots on the UI thread so animated styles
              // reflect final positions before React re-renders.
              const cur = state.get()
              const sorted: string[] = new Array(itemCount)
              for (const key in cur.slots) {
                sorted[cur.slots[key]] = key
              }
              const movedKey = sorted[startSlot]
              sorted.splice(startSlot, 1)
              sorted.splice(newSlot, 0, movedKey)

              const nextSlots: Record<string, number> = {}
              for (let i = 0; i < sorted.length; i++) {
                nextSlots[sorted[i]] = i
              }

              state.set({
                slots: nextSlots,
                activeKey: '',
                dragStartSlot: -1,
              })
              dragY.set(0)
              runOnJS(onCommitReorder)(sorted)
            } else {
              const s = state.get()
              state.set({...s, activeKey: '', dragStartSlot: -1})
              dragY.set(0)
              if (onDragEnd) {
                runOnJS(onDragEnd)()
              }
            }
          }
        }),
      )
    })
    // Reset if the gesture is cancelled without onEnd firing.
    .onFinalize(() => {
      'worklet'
      isGestureActive.set(false)
      if (state.get().activeKey === itemKey && dragY.get() === 0) {
        const s = state.get()
        state.set({...s, activeKey: '', dragStartSlot: -1})
        if (onDragEnd) {
          runOnJS(onDragEnd)()
        }
      }
    })

  // All vertical positioning is via translateY (no `top`). This avoids
  // discrete jumps when slots change — Reanimated smoothly animates from
  // the current translateY to the new target on every state transition.
  // On first mount we skip the animation so items appear instantly.
  const isFirstRender = useSharedValue(true)

  const animatedStyle = useAnimatedStyle(() => {
    const s = state.get()
    const mySlot = s.slots[itemKey]
    if (mySlot === undefined) {
      return {}
    }
    const baseY = mySlot * itemHeight

    // Active item: follow the finger with a slight scale-up.
    if (s.activeKey === itemKey) {
      return {
        transform: [
          {translateY: s.dragStartSlot * itemHeight + dragY.get()},
          {scale: 1.03},
        ],
        zIndex: 999,
        height: itemHeight - 1, // clip bottom border
      }
    }

    // Another item is being dragged — shift to make room.
    if (s.activeKey !== '') {
      isFirstRender.set(false)
      const currentDragPos = Math.round(
        (s.dragStartSlot * itemHeight + dragY.get()) / itemHeight,
      )
      const clampedPos = Math.max(0, Math.min(currentDragPos, itemCount - 1))

      let offset = 0
      if (
        s.dragStartSlot < clampedPos &&
        mySlot > s.dragStartSlot &&
        mySlot <= clampedPos
      ) {
        offset = -itemHeight
      } else if (
        s.dragStartSlot > clampedPos &&
        mySlot < s.dragStartSlot &&
        mySlot >= clampedPos
      ) {
        offset = itemHeight
      }

      return {
        transform: [
          {translateY: withTiming(baseY + offset, {duration: 200})},
          {scale: 1},
        ],
        zIndex: 0,
      }
    }

    // Idle: sit at our slot. On first render use a direct value so items
    // don't animate from y=0. After any drag, use withTiming so the
    // shift→idle transition is smooth (no discrete jump).
    if (isFirstRender.get()) {
      isFirstRender.set(false)
      return {
        transform: [{translateY: baseY}, {scale: 1}],
        zIndex: 0,
      }
    }

    return {
      transform: [{translateY: withTiming(baseY, {duration: 200})}, {scale: 1}],
      zIndex: 0,
    }
  })

  const dragHandle = (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          a.justify_center,
          a.align_center,
          a.px_sm,
          a.py_md,
          web({cursor: 'grab'}),
        ]}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <GripIcon
          size="lg"
          fill={t.atoms.text_contrast_medium.color}
          style={web({pointerEvents: 'none'})}
        />
      </Animated.View>
    </GestureDetector>
  )

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: itemHeight,
          overflow: 'hidden',
        },
        animatedStyle,
      ]}>
      {renderItem(item, dragHandle)}
    </Animated.View>
  )
}
