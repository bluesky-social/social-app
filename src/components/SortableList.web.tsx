import React, {useState} from 'react'
import {View} from 'react-native'

import {useTheme} from '#/alf'
import {GripVertical_Stroke2_Corner0_Rounded as GripIcon} from '#/components/icons/GripVertical'

/**
 * Web implementation of SortableList using pointer events.
 * See SortableList.tsx for the native version using gesture-handler + Reanimated.
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

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
  itemHeight,
}: SortableListProps<T>) {
  const t = useTheme()
  const [dragState, setDragState] = useState<{
    activeIndex: number
    currentY: number
    startY: number
  } | null>(null)

  const getNewPosition = (state: {
    activeIndex: number
    currentY: number
    startY: number
  }) => {
    const translationY = state.currentY - state.startY
    const rawNewPos = Math.round(
      (state.activeIndex * itemHeight + translationY) / itemHeight,
    )
    return Math.max(0, Math.min(rawNewPos, data.length - 1))
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return
    e.preventDefault()
    setDragState(prev => (prev ? {...prev, currentY: e.clientY} : null))
  }

  const handlePointerUp = () => {
    if (!dragState) return
    const newPos = getNewPosition(dragState)
    if (newPos !== dragState.activeIndex) {
      const next = [...data]
      const [moved] = next.splice(dragState.activeIndex, 1)
      next.splice(newPos, 0, moved)
      onReorder(next)
    }
    setDragState(null)
    onDragEnd?.()
  }

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDragState({activeIndex: index, currentY: e.clientY, startY: e.clientY})
    onDragStart?.()
  }

  const newPos = dragState ? getNewPosition(dragState) : -1

  return (
    <View
      style={{height: data.length * itemHeight, position: 'relative'}}
      // @ts-expect-error web-only pointer events
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}>
      {data.map((item, index) => {
        const isActive = dragState?.activeIndex === index

        // Clamp translation so the item stays within list bounds.
        const rawTranslationY = isActive
          ? dragState.currentY - dragState.startY
          : 0
        const translationY = isActive
          ? Math.max(
              -index * itemHeight,
              Math.min(rawTranslationY, (data.length - 1 - index) * itemHeight),
            )
          : 0

        // Non-dragged items shift to make room for the dragged item.
        let offset = 0
        if (dragState && !isActive) {
          const orig = dragState.activeIndex
          if (orig < newPos && index > orig && index <= newPos) {
            offset = -itemHeight
          } else if (orig > newPos && index < orig && index >= newPos) {
            offset = itemHeight
          }
        }

        const dragHandle = (
          <div
            onPointerDown={(e: React.PointerEvent<HTMLDivElement>) =>
              handlePointerDown(e, index)
            }
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 12,
              paddingBottom: 12,
              cursor: isActive ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
            }}>
            <GripIcon
              size="lg"
              fill={t.atoms.text_contrast_medium.color}
              style={{pointerEvents: 'none'} as any}
            />
          </div>
        )

        return (
          <View
            key={keyExtractor(item)}
            style={[
              {
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: isActive ? itemHeight - 1 : itemHeight,
                overflow: 'hidden',
                transform: [
                  {translateY: isActive ? translationY : offset},
                  {scale: isActive ? 1.03 : 1},
                ],
                zIndex: isActive ? 999 : 0,
                // Only animate non-dragged items shifting into place.
                transition:
                  dragState && !isActive ? 'transform 200ms ease' : 'none',
              } as any,
            ]}>
            {renderItem(item, dragHandle)}
          </View>
        )
      })}
    </View>
  )
}
