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

export enum Dir {
  None,
  Up,
  Down,
  Left,
  Right,
}

interface Props {
  panX: Animated.Value
  panY: Animated.Value
  canSwipeLeft?: boolean
  canSwipeRight?: boolean
  canSwipeUp?: boolean
  canSwipeDown?: boolean
  swipeEnabled?: boolean
  hasPriority?: boolean // if has priority, will not release control of the gesture to another gesture
  horzDistThresholdDivisor?: number
  vertDistThresholdDivisor?: number
  useNativeDriver?: boolean
  onSwipeStart?: () => void
  onSwipeStartDirection?: (dir: Dir) => void
  onSwipeEnd?: (dir: Dir) => void
  children: React.ReactNode
}

export function Swipe({
  panX,
  panY,
  canSwipeLeft = false,
  canSwipeRight = false,
  canSwipeUp = false,
  canSwipeDown = false,
  swipeEnabled = true,
  hasPriority = false,
  horzDistThresholdDivisor = 1.75,
  vertDistThresholdDivisor = 1.75,
  useNativeDriver = false,
  onSwipeStart,
  onSwipeStartDirection,
  onSwipeEnd,
  children,
}: Props) {
  const winDim = useWindowDimensions()
  const [dir, setDir] = useState<Dir>(Dir.None)

  const swipeVelocityThreshold = 35
  const swipeHorzDistanceThreshold = winDim.width / horzDistThresholdDivisor
  const swipeVertDistanceThreshold = winDim.height / vertDistThresholdDivisor

  const isMovingHorizontally = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    return (
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.25) &&
      Math.abs(gestureState.vx) > Math.abs(gestureState.vy * 1.25)
    )
  }
  const isMovingVertically = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    return (
      Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 1.25) &&
      Math.abs(gestureState.vy) > Math.abs(gestureState.vx * 1.25)
    )
  }

  const canDir = (d: Dir) => {
    if (d === Dir.Left) return canSwipeLeft
    if (d === Dir.Right) return canSwipeRight
    if (d === Dir.Up) return canSwipeUp
    if (d === Dir.Down) return canSwipeDown
    return false
  }
  const isHorz = (d: Dir) => d === Dir.Left || d === Dir.Right
  const isVert = (d: Dir) => d === Dir.Up || d === Dir.Down

  const canMoveScreen = (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    if (swipeEnabled === false) {
      return false
    }

    const dx = I18nManager.isRTL ? -gestureState.dx : gestureState.dx
    const dy = gestureState.dy
    const willHandle =
      (isMovingHorizontally(event, gestureState) &&
        ((dx > 0 && canSwipeLeft) || (dx < 0 && canSwipeRight))) ||
      (isMovingVertically(event, gestureState) &&
        ((dy > 0 && canSwipeUp) || (dy < 0 && canSwipeDown)))
    return willHandle
  }

  const startGesture = () => {
    setDir(Dir.None)
    onSwipeStart?.()

    panX.stopAnimation()
    // @ts-expect-error: _value is private, but docs use it as well
    panX.setOffset(panX._value)
    panY.stopAnimation()
    // @ts-expect-error: _value is private, but docs use it as well
    panY.setOffset(panY._value)
  }

  const respondToGesture = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    const dx = I18nManager.isRTL ? -gestureState.dx : gestureState.dx
    const dy = gestureState.dy

    let newDir = Dir.None
    if (dir === Dir.None) {
      // establish if the user is swiping horz or vert
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? Dir.Left : Dir.Right
      } else {
        newDir = dy > 0 ? Dir.Up : Dir.Down
      }
    } else if (isHorz(dir)) {
      // direction update
      newDir = dx > 0 ? Dir.Left : Dir.Right
    } else if (isVert(dir)) {
      // direction update
      newDir = dy > 0 ? Dir.Up : Dir.Down
    }

    if (isHorz(newDir)) {
      panX.setValue(
        clamp(
          dx / swipeHorzDistanceThreshold,
          canSwipeRight ? -1 : 0,
          canSwipeLeft ? 1 : 0,
        ) * -1,
      )
      panY.setValue(0)
    } else if (isVert(newDir)) {
      panY.setValue(
        clamp(
          dy / swipeVertDistanceThreshold,
          canSwipeDown ? -1 : 0,
          canSwipeUp ? 1 : 0,
        ) * -1,
      )
      panX.setValue(0)
    }

    if (!canDir(newDir)) {
      newDir = Dir.None
    }
    if (newDir !== dir) {
      setDir(newDir)
      onSwipeStartDirection?.(newDir)
    }
  }

  const finishGesture = (
    _: GestureResponderEvent,
    gestureState: PanResponderGestureState,
  ) => {
    const finish = (finalDir: dir) => () => {
      if (finalDir !== Dir.None) {
        onSwipeEnd?.(finalDir)
      }
      setDir(Dir.None)
      panX.flattenOffset()
      panX.setValue(0)
      panY.flattenOffset()
      panY.setValue(0)
    }
    if (
      isHorz(dir) &&
      (Math.abs(gestureState.dx) > swipeHorzDistanceThreshold / 4 ||
        Math.abs(gestureState.vx) > swipeVelocityThreshold)
    ) {
      Animated.timing(panX, {
        toValue: dir === Dir.Left ? -1 : 1,
        duration: 100,
        useNativeDriver,
      }).start(finish(dir))
    } else if (
      isVert(dir) &&
      (Math.abs(gestureState.dy) > swipeVertDistanceThreshold / 8 ||
        Math.abs(gestureState.vy) > swipeVelocityThreshold)
    ) {
      Animated.timing(panY, {
        toValue: dir === Dir.Up ? -1 : 1,
        duration: 100,
        useNativeDriver,
      }).start(finish(dir))
    } else {
      onSwipeEnd?.(Dir.None)
      Animated.timing(panX, {
        toValue: 0,
        duration: 100,
        useNativeDriver,
      }).start(finish(Dir.None))
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
