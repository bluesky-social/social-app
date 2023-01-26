/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  NativeTouchEvent,
} from 'react-native'
import {Dimensions, Position} from './@types'

type CacheStorageItem = {key: string; value: any}

export const createCache = (cacheSize: number) => ({
  _storage: [] as CacheStorageItem[],
  get(key: string): any {
    const {value} =
      this._storage.find(({key: storageKey}) => storageKey === key) || {}

    return value
  },
  set(key: string, value: any) {
    if (this._storage.length >= cacheSize) {
      this._storage.shift()
    }

    this._storage.push({key, value})
  },
})

export const splitArrayIntoBatches = (arr: any[], batchSize: number): any[] =>
  arr.reduce((result, item) => {
    const batch = result.pop() || []

    if (batch.length < batchSize) {
      batch.push(item)
      result.push(batch)
    } else {
      result.push(batch, [item])
    }

    return result
  }, [])

export const getImageTransform = (
  image: Dimensions | null,
  screen: Dimensions,
) => {
  if (!image?.width || !image?.height) {
    return [] as const
  }

  const wScale = screen.width / image.width
  const hScale = screen.height / image.height
  const scale = Math.min(wScale, hScale)
  const {x, y} = getImageTranslate(image, screen)

  return [{x, y}, scale] as const
}

export const getImageStyles = (
  image: Dimensions | null,
  translate: Animated.ValueXY,
  scale?: Animated.Value,
) => {
  if (!image?.width || !image?.height) {
    return {width: 0, height: 0}
  }

  const transform = translate.getTranslateTransform()

  if (scale) {
    // @ts-ignore TODO - is scale incorrect? might need to remove -prf
    transform.push({scale}, {perspective: new Animated.Value(1000)})
  }

  return {
    width: image.width,
    height: image.height,
    transform,
  }
}

export const getImageTranslate = (
  image: Dimensions,
  screen: Dimensions,
): Position => {
  const getTranslateForAxis = (axis: 'x' | 'y'): number => {
    const imageSize = axis === 'x' ? image.width : image.height
    const screenSize = axis === 'x' ? screen.width : screen.height

    return (screenSize - imageSize) / 2
  }

  return {
    x: getTranslateForAxis('x'),
    y: getTranslateForAxis('y'),
  }
}

export const getImageDimensionsByTranslate = (
  translate: Position,
  screen: Dimensions,
): Dimensions => ({
  width: screen.width - translate.x * 2,
  height: screen.height - translate.y * 2,
})

export const getImageTranslateForScale = (
  currentTranslate: Position,
  targetScale: number,
  screen: Dimensions,
): Position => {
  const {width, height} = getImageDimensionsByTranslate(
    currentTranslate,
    screen,
  )

  const targetImageDimensions = {
    width: width * targetScale,
    height: height * targetScale,
  }

  return getImageTranslate(targetImageDimensions, screen)
}

type HandlerType = (
  event: GestureResponderEvent,
  state: PanResponderGestureState,
) => void

type PanResponderProps = {
  onGrant: HandlerType
  onStart?: HandlerType
  onMove: HandlerType
  onRelease?: HandlerType
  onTerminate?: HandlerType
}

export const createPanResponder = ({
  onGrant,
  onStart,
  onMove,
  onRelease,
  onTerminate,
}: PanResponderProps): PanResponderInstance =>
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: onGrant,
    onPanResponderStart: onStart,
    onPanResponderMove: onMove,
    onPanResponderRelease: onRelease,
    onPanResponderTerminate: onTerminate,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => false,
  })

export const getDistanceBetweenTouches = (
  touches: NativeTouchEvent[],
): number => {
  const [a, b] = touches

  if (a == null || b == null) {
    return 0
  }

  return Math.sqrt(
    Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2),
  )
}
