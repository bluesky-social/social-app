/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Animated} from 'react-native'
import {Dimensions, Position} from './@types'

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
