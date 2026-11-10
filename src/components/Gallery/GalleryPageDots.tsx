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

const DOT_SIZE = 8
const ACTIVE_WIDTH = 30
const ANIMATION_DURATION = 200

/**
 * Optional gallery pagination. Place in `Root`'s footer (including inside a
 * layout wrapper). Web dots are buttons; native exposes a single position label.
 */
export function GalleryPageDots({
  style,
  testID = 'galleryPageDots',
}: {
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {t: l} = useLingui()
  const {label, itemKeys, activeIndex, activateIndex} = useGalleryContext()
  const count = itemKeys.length
  if (count <= 1) return null

  return (
    <View
      testID={testID}
      accessible={!IS_WEB}
      accessibilityRole={IS_WEB ? undefined : 'text'}
      accessibilityLabel={
        IS_WEB
          ? l`${label} pages`
          : l`${label}, item ${activeIndex + 1} of ${count}`
      }
      accessibilityHint=""
      role={IS_WEB ? 'group' : undefined}
      style={[a.flex_row, a.align_center, a.justify_center, style]}>
      {itemKeys.map((key, index) => (
        <PageDot
          key={key}
          active={index === activeIndex}
          label={l`${label}, go to item ${index + 1} of ${count}`}
          testID={`${testID}-${index}`}
          onPress={() => activateIndex(index)}
        />
      ))}
    </View>
  )
}

function PageDot({
  active,
  label,
  testID,
  onPress,
}: {
  active: boolean
  label: string
  testID: string
  onPress: () => void
}) {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
  const width = useRef(
    new Animated.Value(active ? ACTIVE_WIDTH : DOT_SIZE),
  ).current
  const [focused, setFocused] = useState(false)

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
            : t.palette.contrast_200,
        },
      ]}
    />
  )

  if (!IS_WEB) {
    return (
      <View testID={testID} style={[a.px_sm, a.py_md]}>
        {dot}
      </View>
    )
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint=""
      aria-current={active ? 'true' : undefined}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        a.px_sm,
        a.py_md,
        a.rounded_full,
        web({
          cursor: 'pointer',
          outlineStyle: focused ? 'solid' : 'none',
          outlineWidth: 2,
          outlineOffset: 2,
          outlineColor: t.palette.primary_500,
        }),
      ]}>
      {dot}
    </Pressable>
  )
}
