import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Animated, PanResponder, ViewStyle} from 'react-native'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {
  Pointer,
  PointerComponentProps,
  ReleaseComponentFunction,
  useMovingBlocksPointer,
} from 'lib/hooks/waverly/useMovingBlocksPointer'
import {Haptics} from 'lib/haptics'
import {useScreenGeometry} from 'lib/hooks/waverly/useScreenGeometry'

const SCALE_ANIM_DURATION = 100
const SCALE_DOWN = 0.8
const SCALE_UP = 1.3

// The region in which dragging the button will not create text. It is not a
// real "radius" since the region is a rectangle.
// It assumes the fab button is close to the bottom-right of the screen.
const DEAD_RADIUS = 30

type AnimStyleProp =
  | Animated.WithAnimatedObject<ViewStyle>
  | Animated.WithAnimatedArray<ViewStyle>

interface Props extends PointerComponentProps {
  onCreate?: () => void
  style?: AnimStyleProp
  children?: React.ReactNode
  animDuration: number
  disabled?: boolean
}

type State = 'default' | 'pressing' | 'dragging'

export function AddBlockButton({
  onCreate,
  onPointerMoved,
  style,
  children,
  animDuration,
  disabled,
}: Props) {
  const [state, setState] = useState<State>('default')
  const [pointerDelta, setPointerDelta] = useState({x: 0, y: 0})

  const {ref, onLayout, screenGeometry} = useScreenGeometry()

  const refs = useRef({
    state,
    disabled: !!disabled,
    dragShouldCreate: false,
  }).current

  useEffect(() => {
    refs.state = state
  }, [refs, state])

  useEffect(() => {
    if (screenGeometry)
      setPointerDelta({
        x: screenGeometry.pageX + screenGeometry.width / 2,
        y: screenGeometry.pageY + screenGeometry.height / 2,
      })
    else setPointerDelta({x: 0, y: 0})
  }, [screenGeometry])

  const scale = useAnimatedValue(1)

  const onPointerMovedInt = useCallback(
    (pointer?: Pointer) => {
      let res = pointer
      if (res !== undefined) {
        const {x, y} = res
        if (x > -DEAD_RADIUS && y > -DEAD_RADIUS) res = undefined
      }
      if (refs.dragShouldCreate !== !!res) {
        refs.dragShouldCreate = !!res
        Haptics.default()
      }
      onPointerMoved(res)
    },
    [onPointerMoved, refs],
  )

  const onPress = useCallback(() => {
    onCreate?.()
    setState('default')
  }, [onCreate])

  const onDragStart = useCallback(() => {
    refs.dragShouldCreate = false
    setState('dragging')
  }, [refs])

  const onDragStop = useCallback(
    (releaseComponent: ReleaseComponentFunction) => {
      setState('default')
      if (refs.dragShouldCreate) onCreate?.()
      refs.dragShouldCreate = false
      releaseComponent()
    },
    [onCreate, refs],
  )

  const {transform, panResponderCallbacks} = useMovingBlocksPointer({
    onDragStart,
    onDragStop,
    onPointerMoved: onPointerMovedInt,
    pointerDelta,
    animDuration,
  })

  const panResponder = useRef(
    PanResponder.create({
      ...panResponderCallbacks,
      onStartShouldSetPanResponder: () => !refs.disabled,
      onMoveShouldSetPanResponder: () => !refs.disabled,
      onPanResponderGrant: () => setState('pressing'),
      onPanResponderRelease: (...args) => {
        if (refs.state === 'pressing') onPress()
        panResponderCallbacks.onPanResponderRelease?.(...args)
      },
    }),
  ).current

  useEffect(() => {
    const toValue =
      state === 'pressing' ? SCALE_DOWN : state === 'dragging' ? SCALE_UP : 1
    Animated.timing(scale, {
      duration: SCALE_ANIM_DURATION,
      toValue,
      useNativeDriver: false,
    }).start()
  }, [state, scale])

  return (
    <Animated.View
      ref={ref}
      onLayout={onLayout}
      style={[style, {transform: [...transform, {scale}]}]}
      {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  )
}
