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
import {atoms as a, useTheme} from '#/alf'
import {useGalleryContext} from '#/components/Gallery/context'
import {IS_WEB} from '#/env'

const DOT_SIZE = 8
const ACTIVE_WIDTH = 30
const ANIMATION_DURATION = 200

/**
 * Gallery position indicator with reveal buttons on web. Place in `Root`'s
 * footer, including inside a layout wrapper.
 */
export function PageDots({
  style,
  testID = 'galleryPageDots',
}: {
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {t: l} = useLingui()
  const {label, itemKeys, activeIndex, revealIndex} = useGalleryContext()
  const count = itemKeys.length
  if (count <= 1) return null
  const position = activeIndex + 1

  return (
    <View
      testID={testID}
      accessible={!IS_WEB}
      accessibilityRole={IS_WEB ? 'group' : 'text'}
      accessibilityLabel={l({
        message: `${label}, item ${position} of ${count}`,
        comment:
          'Screen reader label for the carousel position. {label} is the carousel name, {position} is the 1-based number of the current item, and {count} is the total number of items.',
      })}
      accessibilityHint=""
      style={[a.flex_row, a.align_center, a.justify_center, a.pt_sm, style]}>
      {itemKeys.map((key, index) => (
        <PageDot
          key={key}
          active={index === activeIndex}
          testID={`${testID}-${index}`}
          label={l({
            message: `Show item ${index + 1} of ${count}`,
            comment:
              'Accessible label for a button that reveals an item in a carousel. The numbers are the 1-based item position and total item count.',
          })}
          onPress={() => revealIndex(index)}
        />
      ))}
    </View>
  )
}

function PageDot({
  active,
  testID,
  label,
  onPress,
}: {
  active: boolean
  testID: string
  label: string
  onPress: () => void
}) {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
  const [hovered, setHovered] = useState(false)
  const width = useRef(
    new Animated.Value(active ? ACTIVE_WIDTH : DOT_SIZE),
  ).current

  useEffect(() => {
    const target = active ? ACTIVE_WIDTH : DOT_SIZE
    if (reduceMotionEnabled) {
      width.setValue(target)
      return
    }
    const animation = Animated.timing(width, {
      toValue: target,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [active, reduceMotionEnabled, width])

  const dot = (
    <Animated.View
      accessible={false}
      style={[
        a.rounded_full,
        {
          width,
          height: DOT_SIZE,
          backgroundColor: active
            ? t.palette.primary_500
            : hovered
              ? t.palette.contrast_300
              : t.palette.contrast_200,
        },
      ]}
    />
  )

  if (IS_WEB) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[a.p_sm, a.px_xs, a.rounded_full]}>
        {dot}
      </Pressable>
    )
  }

  return (
    <View testID={testID} style={[a.p_sm, a.px_xs]}>
      {dot}
    </View>
  )
}
