import React, {useState} from 'react'
import {
  Animated,
  GestureResponderEvent,
  I18nManager,
  PanResponder,
  PanResponderGestureState,
  useWindowDimensions,
  View,
} from 'react-native'
import {clamp} from 'lodash'

interface Props {
  panX: Animated.Value
  canSwipeLeft?: boolean
  canSwipeRight?: boolean
  swipeEnabled?: boolean
  hasPriority?: boolean // if has priority, will not release control of the gesture to another gesture
  distThresholdDivisor?: number
  useNativeDriver?: boolean
  onSwipeStart?: () => void
  onSwipeStartDirection?: (dx: number) => void
  onSwipeEnd?: (dx: number) => void
  children: React.ReactNode
}

export function HorzSwipe({
  panX,
  canSwipeLeft = false,
  canSwipeRight = false,
  swipeEnabled = true,
  hasPriority = false,
  distThresholdDivisor = 1.75,
  useNativeDriver = false,
  onSwipeStart,
  onSwipeStartDirection,
  onSwipeEnd,
  children,
}: Props) {
  const winDim = useWindowDimensions()
  const [dir, setDir] = useState<number>(0)

  const swipeVelocityThreshold = 35
  const swipeDistanceThreshold = winDim.width / distThresholdDivisor

  const isMovingHorizontally = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    return (
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5) &&
      Math.abs(gestureState.vx) > Math.abs(gestureState.vy * 1.5)
    )
  }

  const canMoveScreen = (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    if (swipeEnabled === false) {
      return false
    }

    const diffX = I18nManager.isRTL ? -gestureState.dx : gestureState.dx
    const willHandle =
      isMovingHorizontally(event, gestureState) &&
      ((diffX > 0 && canSwipeLeft) || (diffX < 0 && canSwipeRight))
    return willHandle
  }

  const startGesture = () => {
    setDir(0)
    onSwipeStart?.()

    // TODO
    // if (keyboardDismissMode === 'on-drag') {
    //   Keyboard.dismiss()
    // }

    panX.stopAnimation()
    // @ts-expect-error: _value is private, but docs use it as well
    panX.setOffset(panX._value)
  }

  const respondToGesture = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    const diffX = I18nManager.isRTL ? -gestureState.dx : gestureState.dx

    if (
      // swiping left
      (diffX > 0 && !canSwipeLeft) ||
      // swiping right
      (diffX < 0 && !canSwipeRight)
    ) {
      return
    }

    panX.setValue(clamp(diffX / swipeDistanceThreshold, -1, 1) * -1)

    const newDir = diffX > 0 ? -1 : diffX < 0 ? 1 : 0
    if (newDir !== dir) {
      setDir(newDir)
      onSwipeStartDirection?.(newDir)
    }
  }

  const finishGesture = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    if (
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
      Math.abs(gestureState.vx) > Math.abs(gestureState.vy) &&
      (Math.abs(gestureState.dx) > swipeDistanceThreshold / 3 ||
        Math.abs(gestureState.vx) > swipeVelocityThreshold)
    ) {
      const final = ((gestureState.dx / Math.abs(gestureState.dx)) * -1) | 0
      Animated.timing(panX, {
        toValue: final,
        duration: 100,
        useNativeDriver,
      }).start(() => {
        onSwipeEnd?.(final)
        panX.flattenOffset()
        panX.setValue(0)
      })
    } else {
      onSwipeEnd?.(0)
      Animated.timing(panX, {
        toValue: 0,
        duration: 100,
        useNativeDriver,
      }).start(() => {
        panX.flattenOffset()
        panX.setValue(0)
      })
    }
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: canMoveScreen,
    onPanResponderGrant: startGesture,
    onPanResponderMove: respondToGesture,
    onPanResponderTerminate: finishGesture,
    onPanResponderRelease: finishGesture,
    onPanResponderTerminationRequest: () => !hasPriority,
  })

  return (
    <View {...panResponder.panHandlers} style={{flex: 1}}>
      {children}
    </View>
  )
}
