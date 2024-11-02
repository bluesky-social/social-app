/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {MeasuredDimensions} from 'react-native-reanimated'

export type Dimensions = {
  width: number
  height: number
}

export type Position = {
  x: number
  y: number
}

export type ImageSource = {
  uri: string
  thumbUri: string
  thumbRect: MeasuredDimensions | null
  alt?: string
  dimensions: Dimensions | null
}
