import {useEffect, useRef, useState} from 'react'
import {
  Animated,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useA11y} from '#/state/a11y'
import {atoms as a, useTheme, web} from '#/alf'
import {useGalleryContext} from '#/components/Gallery/context'
import {IS_WEB} from '#/env'

const ANIMATION_DURATION = 200

const SIZES = {
  default: {dot: 8, active: 30},
  subtle: {dot: 5, active: 12},
} as const

/** What `subtle` dots grow to while hovered */
const SUBTLE_EXPANDED = {dot: 7, active: 18}

type Variant = keyof typeof SIZES

/**
 * Passive gallery position indicator. Place in `Root`'s footer (including
 * inside a layout wrapper). Exposes a single position label to screen readers.
 */
export function PageDots({
  style,
  testID = 'galleryPageDots',
  variant = 'default',
  interactive = false,
}: {
  style?: StyleProp<ViewStyle>
  testID?: string
  /**
   * `subtle` is smaller and uses neutral colours, for galleries that sit
   * inside content (e.g. post images) rather than headlining a screen.
   */
  variant?: Variant
  /**
   * Web only. Dots grow while hovered (`subtle` only) and clicking one
   * scrolls to that item. Dots stay out of the tab order and the accessibility
   * tree; keyboard users already have arrow-key navigation.
   */
  interactive?: boolean
}) {
  const {t: l} = useLingui()
  const {label, itemKeys, activeIndex, goToIndex} = useGalleryContext()
  const [hovered, setHovered] = useState(false)
  const isInteractive = interactive && IS_WEB
  const count = itemKeys.length
  if (count <= 1) return null
  const position = activeIndex + 1

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={IS_WEB ? 'image' : 'text'}
      accessibilityLabel={l({
        message: `${label}, item ${position} of ${count}`,
        comment:
          'Screen reader label for the carousel position. {label} is the carousel name, {position} is the 1-based number of the current item, and {count} is the total number of items.',
      })}
      accessibilityHint=""
      style={[
        a.flex_row,
        a.align_center,
        a.justify_center,
        variant === 'subtle' ? a.pt_xs : a.pt_sm,
        style,
      ]}>
      <View
        style={[a.flex_row, a.align_center]}
        onPointerEnter={isInteractive ? () => setHovered(true) : undefined}
        onPointerLeave={isInteractive ? () => setHovered(false) : undefined}>
        {itemKeys.map((key, index) => (
          <PageDot
            key={key}
            active={index === activeIndex}
            variant={variant}
            expanded={hovered}
            onPress={isInteractive ? () => goToIndex(index) : undefined}
            testID={`${testID}-${index}`}
          />
        ))}
      </View>
    </View>
  )
}

function PageDot({
  active,
  variant,
  expanded,
  onPress,
  testID,
}: {
  active: boolean
  variant: Variant
  expanded: boolean
  onPress?: () => void
  testID: string
}) {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
  const subtle = variant === 'subtle'
  const size = subtle && expanded ? SUBTLE_EXPANDED : SIZES[variant]
  const targetWidth = active ? size.active : size.dot
  const width = useRef(new Animated.Value(targetWidth)).current
  const height = useRef(new Animated.Value(size.dot)).current

  useEffect(() => {
    if (reduceMotionEnabled) {
      width.setValue(targetWidth)
      height.setValue(size.dot)
      return
    }
    const animation = Animated.parallel([
      Animated.timing(width, {
        toValue: targetWidth,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(height, {
        toValue: size.dot,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ])
    animation.start()
    return () => animation.stop()
  }, [targetWidth, size.dot, reduceMotionEnabled, width, height])

  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper
      testID={testID}
      onPress={onPress}
      focusable={false}
      accessible={false}
      style={[
        onPress && web({cursor: 'pointer'}),
        subtle
          ? [
              a.justify_center,
              a.py_xs,
              {paddingHorizontal: 2, height: SUBTLE_EXPANDED.dot + 8},
            ]
          : [a.p_sm, a.px_xs],
      ]}>
      <Animated.View
        accessible={false}
        style={[
          a.rounded_full,
          {
            width,
            height,
            backgroundColor: subtle
              ? active
                ? t.palette.contrast_500
                : t.palette.contrast_200
              : active
                ? t.palette.primary_500
                : t.palette.contrast_200,
          },
        ]}
      />
    </Wrapper>
  )
}
