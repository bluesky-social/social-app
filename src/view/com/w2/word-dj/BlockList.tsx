import React, {useCallback, useState} from 'react'
import {StyleProp, StyleSheet, View, ViewProps, ViewStyle} from 'react-native'
import {MoveOutBlock} from './MoveOutBlock'
import {
  PlaceholderInfo,
  useMovingBlocks,
} from 'lib/hooks/waverly/useMovingBlocks'
import {Pointer} from 'lib/hooks/waverly/useMovingBlocksPointer'
import {InsertionPoint} from 'state/models/w2/WordDJModel'

const PLACEHOLDER_HEIGHT = 60
const GAP = 2

export interface PlaceholderProps extends ViewProps {
  forBlock: boolean
}

interface Props {
  pointer?: Pointer
  setPointer: (pointer?: Pointer) => void

  insertionPoint: React.MutableRefObject<InsertionPoint | undefined>

  onPress?: (key: React.Key) => void
  moveStart?: (key: React.Key) => void
  moveEnd?: (key: React.Key) => void

  animDuration: number

  placeholderType?: React.ComponentType<PlaceholderProps>

  visibleScrollHeight: number
  disabled?: boolean

  style: StyleProp<ViewStyle>
  children: React.ReactNode
}

export const BlockList = ({
  pointer,
  setPointer,
  insertionPoint,
  onPress,
  moveStart,
  moveEnd,
  animDuration,
  placeholderType: Placeholder,
  visibleScrollHeight,
  disabled,
  style,
  children,
}: Props) => {
  const [placeholderInfo, setPlaceholderInfo] = useState<
    PlaceholderInfo | undefined
  >()
  const [draggedBlockKey, setDraggedBlockKey] = useState<
    React.Key | undefined
  >()

  const onDragStart = useCallback(
    (key: React.Key) => {
      setDraggedBlockKey(key)
      if (moveStart) moveStart(key)
    },
    [moveStart],
  )

  const onBlockPlaced = useCallback(
    (key: React.Key) => {
      setDraggedBlockKey(undefined)
      if (moveEnd) moveEnd(key)
    },
    [moveEnd],
  )

  const blockPropsFun = useCallback(
    (key: React.Key) => ({
      onPointerMoved: setPointer,
      onPress: () => onPress && onPress(key),
      onDragStart: () => onDragStart(key),
      onBlockPlaced: () => onBlockPlaced(key),
      animDuration,
    }),
    [animDuration, onBlockPlaced, onDragStart, onPress, setPointer],
  )

  const {renderChildren} = useMovingBlocks({
    pointer,
    defaultsPlaceholderHeight: PLACEHOLDER_HEIGHT,
    blocksGap: GAP,
    draggedBlockKey,
    insertionPoint,
    blockType: MoveOutBlock,
    blockProps: blockPropsFun,
    animDuration,
    setPlaceholderInfo,
    visibleScrollHeight,
    disabled,
    containerStyle: styles.listContainer,
  })

  return (
    <View style={style}>
      {Placeholder && pointer && placeholderInfo?.top !== undefined && (
        <Placeholder
          forBlock={draggedBlockKey !== undefined}
          style={[
            styles.placeholder,
            {top: placeholderInfo.top, height: placeholderInfo.height},
          ]}
        />
      )}
      {renderChildren(children)}
    </View>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    gap: GAP,
  },
  placeholder: {
    position: 'absolute',
    left: 0,
    width: '100%',
  },
})
