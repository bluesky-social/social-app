import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  Animated,
  LayoutChangeEvent,
  LayoutRectangle,
  PanResponder,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {BaseBlockProps} from 'lib/hooks/waverly/useMovingBlocks'
import {
  PointerComponentProps,
  ReleaseComponentFunction,
  useMovingBlocksPointer,
} from 'lib/hooks/waverly/useMovingBlocksPointer'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const PRESSED_ANIM_DURATION = 60
const PRESSED_OPACITY = 0.6

interface MoveOutBlockProps extends BaseBlockProps, PointerComponentProps {
  onPress?: () => void
  onDragStart?: () => void
  onDragStop?: () => void
  onBlockPlaced?: () => void
  animDuration: number
  style?: Animated.WithAnimatedObject<ViewStyle>
}

export function MoveOutBlock({
  targetPos,
  onPointerMoved,
  scrollViewGeometry,
  onLayout,
  onPress,
  onDragStart,
  onDragStop,
  onBlockPlaced,
  state,
  setState,
  createPanResponderCallbacks,
  transform,
  animDuration,
  style,
  children,
}: MoveOutBlockProps) {
  const opacity = useAnimatedValue(1)
  const [layout, setLayout] = useState<LayoutRectangle | undefined>()

  const pointerDelta = useMemo(() => {
    if (!layout || !scrollViewGeometry) return undefined
    return {
      x: scrollViewGeometry.pageX + layout.x + layout.width / 2,
      y: scrollViewGeometry.pageY + layout.y,
    }
  }, [layout, scrollViewGeometry])

  const refs = useRef({
    state,
  }).current

  useEffect(() => {
    const toValue = state === 'pressing' ? PRESSED_OPACITY : 1
    Animated.timing(opacity, {
      duration: PRESSED_ANIM_DURATION,
      toValue,
      useNativeDriver: false,
    }).start()
  }, [opacity, state])

  const _onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      setLayout(e.nativeEvent.layout)
      onLayout?.(e)
    },
    [onLayout],
  )

  const _onDragStop = useCallback(
    (releaseComponent: ReleaseComponentFunction) => {
      setState('moving')
      releaseComponent(targetPos.current, () => {
        onBlockPlaced?.()
        setState(s => (s !== 'moving' ? s : 'default'))
      })
      onDragStop?.()
    },
    [onBlockPlaced, onDragStop, setState, targetPos],
  )

  const {
    transform: dragTransform,
    panResponderCallbacks,
    forceStartDragging,
  } = useMovingBlocksPointer({
    pointerDelta,
    onPointerMoved,
    onDragStart: () => setState('dragging'),
    onDragStop: _onDragStop,
    animDuration,
  })

  useEffect(() => {
    if (state === 'dragging' && refs.state !== 'dragging') {
      forceStartDragging()
      onDragStart?.()
    } else if (state === 'default' && refs.state === 'pressing') {
      onPress?.()
    } else if (state === 'canceled') {
      setState('default')
    }
    refs.state = state
  }, [forceStartDragging, onDragStart, onPress, refs, setState, state])

  const panResponder = useRef(
    PanResponder.create(createPanResponderCallbacks(panResponderCallbacks)),
  ).current

  const zIndex = state === 'dragging' || state === 'moving' ? 1 : 0

  return (
    <Animated.View
      onLayout={_onLayout}
      style={[
        styles.moveOutBlock,
        style,
        {transform: [...transform, ...dragTransform]},
        {zIndex},
        {opacity},
      ]}
      {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  moveOutBlock: {},
})
