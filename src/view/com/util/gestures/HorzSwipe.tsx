import React from 'react'
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
  canSwipeLeft: boolean
  canSwipeRight: boolean
  swipeEnabled: boolean
  onSwipeStart?: () => void
  onSwipeEnd?: (dx: number) => void
  children: React.ReactNode
}

export function HorzSwipe({
  panX,
  canSwipeLeft,
  canSwipeRight,
  swipeEnabled = true,
  onSwipeStart,
  onSwipeEnd,
  children,
}: Props) {
  const winDim = useWindowDimensions()

  const swipeVelocityThreshold = 35
  const swipeDistanceThreshold = winDim.width / 1.75

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
    return (
      isMovingHorizontally(event, gestureState) &&
      ((diffX > 0 && canSwipeLeft) || (diffX < 0 && canSwipeRight))
    )
  }

  const startGesture = () => {
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
  }

  const finishGesture = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    panX.flattenOffset()
    panX.setValue(0)
    if (
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
      Math.abs(gestureState.vx) > Math.abs(gestureState.vy) &&
      (Math.abs(gestureState.dx) > swipeDistanceThreshold / 3 ||
        Math.abs(gestureState.vx) > swipeVelocityThreshold)
    ) {
      onSwipeEnd?.(((gestureState.dx / Math.abs(gestureState.dx)) * -1) | 0)
    } else {
      onSwipeEnd?.(0)
    }
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: canMoveScreen,
    onMoveShouldSetPanResponderCapture: canMoveScreen,
    onPanResponderGrant: startGesture,
    onPanResponderMove: respondToGesture,
    onPanResponderTerminate: finishGesture,
    onPanResponderRelease: finishGesture,
    onPanResponderTerminationRequest: () => true,
  })

  return (
    <View {...panResponder.panHandlers} style={{flex: 1}}>
      {children}
    </View>
  )
}
