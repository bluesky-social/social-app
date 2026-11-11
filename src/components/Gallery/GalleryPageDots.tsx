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
  const position = activeIndex + 1

  return (
    <View
      testID={testID}
      accessible={!IS_WEB}
      accessibilityRole={IS_WEB ? undefined : 'text'}
      accessibilityLabel={
        IS_WEB
          ? l`${label} pages`
          : l({
              message: `${label}, item ${position} of ${count}`,
              comment:
                'Screen reader label for the carousel position on native. {label} is the carousel name, {position} is the 1-based number of the current item, and {count} is the total number of items.',
            })
      }
      accessibilityHint=""
      role={IS_WEB ? 'group' : undefined}
      style={[a.flex_row, a.align_center, a.justify_center, a.pt_sm, style]}>
      {itemKeys.map((key, index) => {
        const position = index + 1
        return (
          <PageDot
            key={key}
            active={index === activeIndex}
            label={l({
              message: `${label}, go to item ${position} of ${count}`,
              comment:
                'Accessibility label for a web button that scrolls the carousel to an item. {label} is the carousel name, {position} is the 1-based number of the target item, and {count} is the total number of items.',
            })}
            testID={`${testID}-${index}`}
            onPress={() => activateIndex(index)}
          />
        )
      })}
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
      <View testID={testID} style={[a.px_xs, a.py_sm]}>
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
        a.px_xs,
        a.py_sm,
        a.rounded_full,
        web({
          cursor: 'pointer',
          outlineStyle: 'none',
        }),
      ]}>
      {dot}
      <View
        style={[
          a.absolute,
          a.rounded_full,
          {
            top: 2,
            bottom: 2,
            left: 2,
            right: 2,
            borderWidth: 2,
            borderColor: t.palette.primary_500,
            opacity: focused ? 1 : 0,
          },
        ]}
      />
    </Pressable>
  )
}
