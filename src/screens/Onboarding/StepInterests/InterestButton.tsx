import React from 'react'
import {View, ViewStyle, TextStyle} from 'react-native'

import {useTheme, atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

import {INTEREST_TO_DISPLAY_NAME} from '#/screens/Onboarding/StepInterests/data'

export function InterestButton({interest}: {interest: string}) {
  const t = useTheme()
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
          ctx.selected ? styles.textSelected : {},
        ]}>
        {INTEREST_TO_DISPLAY_NAME[interest]}
      </Text>
    </View>
  )
}
