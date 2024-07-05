import React from 'react'
import {TextStyle, View, ViewStyle} from 'react-native'

import {capitalize} from '#/lib/strings/capitalize'
import {useInterestsDisplayNames} from '#/screens/Onboarding/state'
import {atoms as a, native, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

export function InterestButton({interest}: {interest: string}) {
  const t = useTheme()
  const interestsDisplayNames = useInterestsDisplayNames()
  const ctx = Toggle.useItemContext()

  const styles = React.useMemo(() => {
    const hovered: ViewStyle[] = [
      {
        backgroundColor:
          t.name === 'light' ? t.palette.contrast_200 : t.palette.contrast_50,
      },
    ]
    const focused: ViewStyle[] = []
    const pressed: ViewStyle[] = []
    const selected: ViewStyle[] = [
      {
        backgroundColor: t.palette.contrast_900,
      },
    ]
    const selectedHover: ViewStyle[] = [
      {
        backgroundColor: t.palette.contrast_800,
      },
    ]
    const textSelected: TextStyle[] = [
      {
        color: t.palette.contrast_100,
      },
    ]

    return {
      hovered,
      focused,
      pressed,
      selected,
      selectedHover,
      textSelected,
    }
  }, [t])

  return (
    <View
      style={[
        {
          backgroundColor: t.palette.contrast_100,
          paddingVertical: 15,
        },
        a.rounded_full,
        a.px_2xl,
        ctx.hovered ? styles.hovered : {},
        ctx.focused ? styles.hovered : {},
        ctx.pressed ? styles.hovered : {},
        ctx.selected ? styles.selected : {},
        ctx.selected && (ctx.hovered || ctx.focused || ctx.pressed)
          ? styles.selectedHover
          : {},
      ]}>
      <Text
        style={[
          {
            color: t.palette.contrast_900,
          },
          a.font_bold,
          native({paddingTop: 2}),
          ctx.selected ? styles.textSelected : {},
        ]}>
        {interestsDisplayNames[interest] || capitalize(interest)}
      </Text>
    </View>
  )
}
