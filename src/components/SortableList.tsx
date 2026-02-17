import React, {useLayoutEffect, useRef} from 'react'
import {View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme, web} from '#/alf'
import {GripVertical_Stroke2_Corner0_Rounded as GripIcon} from '#/components/icons/GripVertical'

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
}

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
}: SortableListProps<T>) {
  const state = useSharedValue<DragState>({
    slots: Object.fromEntries(data.map((item, i) => [keyExtractor(item), i])),
    activeKey: '',
    dragStartSlot: -1,
  })
  const dragY = useSharedValue(0)

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

  // Render in stable key order so React never reorders native views.
  // On Android, native ViewGroup child reordering causes a visual flash.
  const sortedData = [...data].sort((a, b) => {
    const ka = keyExtractor(a)
    const kb = keyExtractor(b)
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })

  return (
    <View style={{height: data.length * itemHeight}}>
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
            renderItem={renderItem}
            onCommitReorder={handleReorder}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        )
      })}
    </View>
  )
}

function SortableItem<T>({
  item,
  itemKey,
  itemCount,
  itemHeight,
  state,
  dragY,
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
      if (onDragStart) {
        runOnJS(onDragStart)()
      }
      runOnJS(playHaptic)()
    })
    .onChange(e => {
      'worklet'
      // Clamp so the item can't leave list bounds.
      const startSlot = state.get().dragStartSlot
      const minY = -startSlot * itemHeight
      const maxY = (itemCount - 1 - startSlot) * itemHeight
      dragY.set(Math.max(minY, Math.min(e.translationY, maxY)))
    })
    .onEnd(() => {
      'worklet'
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
