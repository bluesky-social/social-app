/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useMemo, useEffect} from 'react'
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  GestureResponderHandlers,
  NativeTouchEvent,
  PanResponderGestureState,
} from 'react-native'

import {Position} from '../@types'
import {
  createPanResponder,
  getDistanceBetweenTouches,
  getImageTranslate,
  getImageDimensionsByTranslate,
} from '../utils'

const SCREEN = Dimensions.get('window')
const SCREEN_WIDTH = SCREEN.width
const SCREEN_HEIGHT = SCREEN.height
const MIN_DIMENSION = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT)
const ANDROID_BAR_HEIGHT = 24

const MIN_ZOOM = 2
const MAX_SCALE = 2
const DOUBLE_TAP_DELAY = 300
const OUT_BOUND_MULTIPLIER = 0.75

type Props = {
  initialScale: number
  initialTranslate: Position
  onZoom: (isZoomed: boolean) => void
  doubleTapToZoomEnabled: boolean
  onLongPress: () => void
  delayLongPress: number
}

const usePanResponder = ({
  initialScale,
  initialTranslate,
  onZoom,
  doubleTapToZoomEnabled,
  onLongPress,
  delayLongPress,
}: Props): Readonly<
  [GestureResponderHandlers, Animated.Value, Animated.ValueXY]
> => {
  let numberInitialTouches = 1
  let initialTouches: NativeTouchEvent[] = []
  let currentScale = initialScale
  let currentTranslate = initialTranslate
  let tmpScale = 0
  let tmpTranslate: Position | null = null
  let isDoubleTapPerformed = false
  let lastTapTS: number | null = null
  let longPressHandlerRef: NodeJS.Timeout | null = null

  const meaningfulShift = MIN_DIMENSION * 0.01
  const scaleValue = new Animated.Value(initialScale)
  const translateValue = new Animated.ValueXY(initialTranslate)

  const imageDimensions = getImageDimensionsByTranslate(
    initialTranslate,
    SCREEN,
  )

  const getBounds = (scale: number) => {
    const scaledImageDimensions = {
      width: imageDimensions.width * scale,
      height: imageDimensions.height * scale,
    }
    const translateDelta = getImageTranslate(scaledImageDimensions, SCREEN)

    const left = initialTranslate.x - translateDelta.x
    const right = left - (scaledImageDimensions.width - SCREEN.width)
    const top = initialTranslate.y - translateDelta.y
    const bottom = top - (scaledImageDimensions.height - SCREEN.height)

    return [top, left, bottom, right]
  }

  const getTransformAfterDoubleTap = (
    touchX: number,
    touchY: number,
  ): [number, Position] => {
    let nextScale = initialScale
    let nextTranslateX = initialTranslate.x
    let nextTranslateY = initialTranslate.y

    // First, let's figure out how much we want to zoom in.
    // We want to try to zoom in at least close enough to get rid of black bars.
    const imageAspect = imageDimensions.width / imageDimensions.height
    const screenAspect = SCREEN.width / SCREEN.height
    let zoom = Math.max(
      imageAspect / screenAspect,
      screenAspect / imageAspect,
      MIN_ZOOM,
    )
    // Don't zoom so hard that the original image's pixels become blurry.
    zoom = Math.min(zoom, MAX_SCALE / initialScale)
    nextScale = initialScale * zoom

    // Next, let's see if we need to adjust the scaled image translation.
    // Ideally, we want the tapped point to stay under the finger after the scaling.
    const dx = SCREEN.width / 2 - touchX
    const dy = SCREEN.height / 2 - (touchY - ANDROID_BAR_HEIGHT)
    // Before we try to adjust the translation, check how much wiggle room we have.
    // We don't want to introduce new black bars or make existing black bars unbalanced.
    const [topBound, leftBound, bottomBound, rightBound] = getBounds(nextScale)
    if (leftBound > rightBound) {
      // Content fills the screen horizontally so we have horizontal wiggle room.
      // Try to keep the tapped point under the finger after zoom.
      nextTranslateX += dx * zoom - dx
      nextTranslateX = Math.min(nextTranslateX, leftBound)
      nextTranslateX = Math.max(nextTranslateX, rightBound)
    }
    if (topBound > bottomBound) {
      // Content fills the screen vertically so we have vertical wiggle room.
      // Try to keep the tapped point under the finger after zoom.
      nextTranslateY += dy * zoom - dy
      nextTranslateY = Math.min(nextTranslateY, topBound)
      nextTranslateY = Math.max(nextTranslateY, bottomBound)
    }

    return [
      nextScale,
      {
        x: nextTranslateX,
        y: nextTranslateY,
      },
    ]
  }

  const fitsScreenByWidth = () =>
    imageDimensions.width * currentScale < SCREEN_WIDTH
  const fitsScreenByHeight = () =>
    imageDimensions.height * currentScale < SCREEN_HEIGHT

  useEffect(() => {
    scaleValue.addListener(({value}) => {
      if (typeof onZoom === 'function') {
        onZoom(value !== initialScale)
      }
    })

    return () => scaleValue.removeAllListeners()
  })

  const cancelLongPressHandle = () => {
    longPressHandlerRef && clearTimeout(longPressHandlerRef)
  }

  const handlers = {
    onGrant: (
      _: GestureResponderEvent,
      gestureState: PanResponderGestureState,
    ) => {
      numberInitialTouches = gestureState.numberActiveTouches

      if (gestureState.numberActiveTouches > 1) {
        return
      }

      longPressHandlerRef = setTimeout(onLongPress, delayLongPress)
    },
    onStart: (
      event: GestureResponderEvent,
      gestureState: PanResponderGestureState,
    ) => {
      initialTouches = event.nativeEvent.touches
      numberInitialTouches = gestureState.numberActiveTouches

      if (gestureState.numberActiveTouches > 1) {
        return
      }

      const tapTS = Date.now()
      // Handle double tap event by calculating diff between first and second taps timestamps

      isDoubleTapPerformed = Boolean(
        lastTapTS && tapTS - lastTapTS < DOUBLE_TAP_DELAY,
      )

      if (doubleTapToZoomEnabled && isDoubleTapPerformed) {
        let nextScale = initialScale
        let nextTranslate = initialTranslate

        const willZoom = currentScale === initialScale
        if (willZoom) {
          const {pageX: touchX, pageY: touchY} = event.nativeEvent.touches[0]
          ;[nextScale, nextTranslate] = getTransformAfterDoubleTap(
            touchX,
            touchY,
          )
        }
        onZoom(willZoom)

        Animated.parallel(
          [
            Animated.timing(translateValue.x, {
              toValue: nextTranslate.x,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateValue.y, {
              toValue: nextTranslate.y,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: nextScale,
              duration: 300,
              useNativeDriver: true,
            }),
          ],
          {stopTogether: false},
        ).start(() => {
          currentScale = nextScale
          currentTranslate = nextTranslate
        })

        lastTapTS = null
      } else {
        lastTapTS = Date.now()
      }
    },
    onMove: (
      event: GestureResponderEvent,
      gestureState: PanResponderGestureState,
    ) => {
      const {dx, dy} = gestureState

      if (Math.abs(dx) >= meaningfulShift || Math.abs(dy) >= meaningfulShift) {
        cancelLongPressHandle()
      }

      // Don't need to handle move because double tap in progress (was handled in onStart)
      if (doubleTapToZoomEnabled && isDoubleTapPerformed) {
        cancelLongPressHandle()
        return
      }

      if (
        numberInitialTouches === 1 &&
        gestureState.numberActiveTouches === 2
      ) {
        numberInitialTouches = 2
        initialTouches = event.nativeEvent.touches
      }

      const isTapGesture =
        numberInitialTouches === 1 && gestureState.numberActiveTouches === 1
      const isPinchGesture =
        numberInitialTouches === 2 && gestureState.numberActiveTouches === 2

      if (isPinchGesture) {
        cancelLongPressHandle()

        const initialDistance = getDistanceBetweenTouches(initialTouches)
        const currentDistance = getDistanceBetweenTouches(
          event.nativeEvent.touches,
        )

        let nextScale = (currentDistance / initialDistance) * currentScale

        /**
         * In case image is scaling smaller than initial size ->
         * slow down this transition by applying OUT_BOUND_MULTIPLIER
         */
        if (nextScale < initialScale) {
          nextScale =
            nextScale + (initialScale - nextScale) * OUT_BOUND_MULTIPLIER
        }

        /**
         * In case image is scaling down -> move it in direction of initial position
         */
        if (currentScale > initialScale && currentScale > nextScale) {
          const k = (currentScale - initialScale) / (currentScale - nextScale)

          const nextTranslateX =
            nextScale < initialScale
              ? initialTranslate.x
              : currentTranslate.x -
                (currentTranslate.x - initialTranslate.x) / k

          const nextTranslateY =
            nextScale < initialScale
              ? initialTranslate.y
              : currentTranslate.y -
                (currentTranslate.y - initialTranslate.y) / k

          translateValue.x.setValue(nextTranslateX)
          translateValue.y.setValue(nextTranslateY)

          tmpTranslate = {x: nextTranslateX, y: nextTranslateY}
        }

        scaleValue.setValue(nextScale)
        tmpScale = nextScale
      }

      if (isTapGesture && currentScale > initialScale) {
        const {x, y} = currentTranslate
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {dx, dy} = gestureState
        const [topBound, leftBound, bottomBound, rightBound] =
          getBounds(currentScale)

        let nextTranslateX = x + dx
        let nextTranslateY = y + dy

        if (nextTranslateX > leftBound) {
          nextTranslateX =
            nextTranslateX - (nextTranslateX - leftBound) * OUT_BOUND_MULTIPLIER
        }

        if (nextTranslateX < rightBound) {
          nextTranslateX =
            nextTranslateX -
            (nextTranslateX - rightBound) * OUT_BOUND_MULTIPLIER
        }

        if (nextTranslateY > topBound) {
          nextTranslateY =
            nextTranslateY - (nextTranslateY - topBound) * OUT_BOUND_MULTIPLIER
        }

        if (nextTranslateY < bottomBound) {
          nextTranslateY =
            nextTranslateY -
            (nextTranslateY - bottomBound) * OUT_BOUND_MULTIPLIER
        }

        if (fitsScreenByWidth()) {
          nextTranslateX = x
        }

        if (fitsScreenByHeight()) {
          nextTranslateY = y
        }

        translateValue.x.setValue(nextTranslateX)
        translateValue.y.setValue(nextTranslateY)

        tmpTranslate = {x: nextTranslateX, y: nextTranslateY}
      }
    },
    onRelease: () => {
      cancelLongPressHandle()

      if (isDoubleTapPerformed) {
        isDoubleTapPerformed = false
      }

      if (tmpScale > 0) {
        if (tmpScale < initialScale || tmpScale > MAX_SCALE) {
          tmpScale = tmpScale < initialScale ? initialScale : MAX_SCALE
          Animated.timing(scaleValue, {
            toValue: tmpScale,
            duration: 100,
            useNativeDriver: true,
          }).start()
        }

        currentScale = tmpScale
        tmpScale = 0
      }

      if (tmpTranslate) {
        const {x, y} = tmpTranslate
        const [topBound, leftBound, bottomBound, rightBound] =
          getBounds(currentScale)

        let nextTranslateX = x
        let nextTranslateY = y

        if (!fitsScreenByWidth()) {
          if (nextTranslateX > leftBound) {
            nextTranslateX = leftBound
          } else if (nextTranslateX < rightBound) {
            nextTranslateX = rightBound
          }
        }

        if (!fitsScreenByHeight()) {
          if (nextTranslateY > topBound) {
            nextTranslateY = topBound
          } else if (nextTranslateY < bottomBound) {
            nextTranslateY = bottomBound
          }
        }

        Animated.parallel([
          Animated.timing(translateValue.x, {
            toValue: nextTranslateX,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(translateValue.y, {
            toValue: nextTranslateY,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start()

        currentTranslate = {x: nextTranslateX, y: nextTranslateY}
        tmpTranslate = null
      }
    },
  }

  const panResponder = useMemo(() => createPanResponder(handlers), [handlers])

  return [panResponder.panHandlers, scaleValue, translateValue]
}

export default usePanResponder
