import {useEffect, useRef} from 'react'
import {Animated, type StyleProp, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useA11y} from '#/state/a11y'
import {atoms as a, useTheme} from '#/alf'
import {useGalleryContext} from '#/components/Gallery/context'
import {IS_WEB} from '#/env'

const DOT_SIZE = 8
const ACTIVE_WIDTH = 30
const ANIMATION_DURATION = 200

/**
 * Passive gallery position indicator. Place in `Root`'s footer (including
 * inside a layout wrapper). Exposes a single position label to screen readers.
 */
export function PageDots({
  style,
  testID = 'galleryPageDots',
}: {
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {t: l} = useLingui()
  const {label, itemKeys, activeIndex} = useGalleryContext()
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
      style={[a.flex_row, a.align_center, a.justify_center, a.pt_sm, style]}>
      {itemKeys.map((key, index) => (
        <PageDot
          key={key}
          active={index === activeIndex}
          testID={`${testID}-${index}`}
        />
      ))}
    </View>
  )
}

function PageDot({active, testID}: {active: boolean; testID: string}) {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
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

  return (
    <View testID={testID} style={[a.p_sm, a.px_xs]}>
      <Animated.View
        accessible={false}
        style={[
          a.rounded_full,
          {
            width,
            height: DOT_SIZE,
            backgroundColor: active
              ? t.palette.primary_500
              : t.palette.contrast_200,
          },
        ]}
      />
    </View>
  )
}
