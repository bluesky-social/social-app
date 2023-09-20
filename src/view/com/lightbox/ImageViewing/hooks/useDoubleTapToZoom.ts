/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useCallback} from 'react'
import {ScrollView, NativeTouchEvent, NativeSyntheticEvent} from 'react-native'

import {Dimensions} from '../@types'

const DOUBLE_TAP_DELAY = 300
const MIN_ZOOM = 2

let lastTapTS: number | null = null

/**
 * This is iOS only.
 * Same functionality for Android implemented inside usePanResponder hook.
 */
function useDoubleTapToZoom(
  scrollViewRef: React.RefObject<ScrollView>,
  scaled: boolean,
  screen: Dimensions,
  imageDimensions: Dimensions | null,
) {
  const handleDoubleTap = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      const nowTS = new Date().getTime()
      const scrollResponderRef = scrollViewRef?.current?.getScrollResponder()

      const getZoomRectAfterDoubleTap = (
        touchX: number,
        touchY: number,
      ): {
        x: number
        y: number
        width: number
        height: number
      } => {
        if (!imageDimensions) {
          return {
            x: 0,
            y: 0,
            width: screen.width,
            height: screen.height,
          }
        }

        // First, let's figure out how much we want to zoom in.
        // We want to try to zoom in at least close enough to get rid of black bars.
        const imageAspect = imageDimensions.width / imageDimensions.height
        const screenAspect = screen.width / screen.height
        const zoom = Math.max(
          imageAspect / screenAspect,
          screenAspect / imageAspect,
          MIN_ZOOM,
        )
        // Unlike in the Android version, we don't constrain the *max* zoom level here.
        // Instead, this is done in the ScrollView props so that it constraints pinch too.

        // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
        // We already know the zoom level, so this gives us the rectangle size.
        let rectWidth = screen.width / zoom
        let rectHeight = screen.height / zoom

        // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
        // We don't want to introduce new black bars or make existing black bars unbalanced.
        let minX = 0
        let minY = 0
        let maxX = screen.width - rectWidth
        let maxY = screen.height - rectHeight
        if (imageAspect >= screenAspect) {
          // The image has horizontal black bars. Exclude them from the safe area.
          const renderedHeight = screen.width / imageAspect
          const horizontalBarHeight = (screen.height - renderedHeight) / 2
          minY += horizontalBarHeight
          maxY -= horizontalBarHeight
        } else {
          // The image has vertical black bars. Exclude them from the safe area.
          const renderedWidth = screen.height * imageAspect
          const verticalBarWidth = (screen.width - renderedWidth) / 2
          minX += verticalBarWidth
          maxX -= verticalBarWidth
        }

        // Finally, we can position the rect according to its size and the safe area.
        let rectX
        if (maxX >= minX) {
          // Content fills the screen horizontally so we have horizontal wiggle room.
          // Try to keep the tapped point under the finger after zoom.
          rectX = touchX - touchX / zoom
          rectX = Math.min(rectX, maxX)
          rectX = Math.max(rectX, minX)
        } else {
          // Keep the rect centered on the screen so that black bars are balanced.
          rectX = screen.width / 2 - rectWidth / 2
        }
        let rectY
        if (maxY >= minY) {
          // Content fills the screen vertically so we have vertical wiggle room.
          // Try to keep the tapped point under the finger after zoom.
          rectY = touchY - touchY / zoom
          rectY = Math.min(rectY, maxY)
          rectY = Math.max(rectY, minY)
        } else {
          // Keep the rect centered on the screen so that black bars are balanced.
          rectY = screen.height / 2 - rectHeight / 2
        }

        return {
          x: rectX,
          y: rectY,
          height: rectHeight,
          width: rectWidth,
        }
      }

      if (lastTapTS && nowTS - lastTapTS < DOUBLE_TAP_DELAY) {
        let nextZoomRect = {
          x: 0,
          y: 0,
          width: screen.width,
          height: screen.height,
        }

        const willZoom = !scaled
        if (willZoom) {
          const {pageX, pageY} = event.nativeEvent
          nextZoomRect = getZoomRectAfterDoubleTap(pageX, pageY)
        }

        // @ts-ignore
        scrollResponderRef?.scrollResponderZoomTo({
          ...nextZoomRect, // This rect is in screen coordinates
          animated: true,
        })
      } else {
        lastTapTS = nowTS
      }
    },
    [imageDimensions, scaled, screen.height, screen.width, scrollViewRef],
  )

  return handleDoubleTap
}

export default useDoubleTapToZoom
