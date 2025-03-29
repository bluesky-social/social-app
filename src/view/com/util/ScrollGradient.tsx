import React from 'react'
import {StyleSheet} from 'react-native'
import Animated, {type SharedValue, useAnimatedStyle} from 'react-native-reanimated'

import {useTheme} from '#/alf'

/**
 * Creates gradient overlays that indicate when content can be scrolled left/right.
 * The gradient appears on either the left or right edge based on scroll position
 * and only shows when there is actually overflowing content in that direction.
 */
export function ScrollGradient({
  side,
  scrollX,
  contentWidth,
  containerWidth,
}: {
  side: 'left' | 'right'
  scrollX: SharedValue<number>
  contentWidth: SharedValue<number>
  containerWidth: SharedValue<number>
}) {
  const t = useTheme()
  const style = useAnimatedStyle(() => {
    const maxScroll = contentWidth.value - containerWidth.value
    // Only show gradients if there's overflow
    const hasOverflow = maxScroll > 0
    const opacity = !hasOverflow
      ? 0
      : side === 'left'
      ? scrollX.value > 0
        ? 1
        : 0
      : scrollX.value < maxScroll
      ? 1
      : 0
    return {opacity}
  })

  const layers = React.useMemo(() => {
    const baseColor = t.atoms.bg.backgroundColor
    return Array.from({length: 25}).map((_, i) => {
      const progress = i / 24 // 0 to 1
      const opacity = Math.pow(1 - progress, 2) // Exponential decay

      const width = 8
      const offset = i * (width / 2) // overlap layers for smooth blend

      return (
        <Animated.View
          key={i}
          style={[
            styles.gradientLayer,
            {
              backgroundColor: baseColor,
              opacity: opacity * 0.95,
              left: side === 'left' ? offset : undefined,
              right: side === 'right' ? offset : undefined,
              width,
            },
          ]}
        />
      )
    })
  }, [side, t.atoms.bg.backgroundColor])

  return (
    <Animated.View
      pointerEvents="none" // allows touch events to pass through
      style={[
        styles.gradient,
        style,
        side === 'left' ? styles.left : styles.right,
      ]}>
      {layers}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
    flexDirection: 'row',
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
})
