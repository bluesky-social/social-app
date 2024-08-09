import React from 'react'
import {AccessibilityProps, TextStyle, View, ViewStyle} from 'react-native'

import {atoms as a, native, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

type ItemProps = Omit<Toggle.ItemProps, 'style' | 'role' | 'children'> &
  AccessibilityProps & {
    children: React.ReactElement
    testID?: string
  }

export type GroupProps = Omit<Toggle.GroupProps, 'style' | 'type'> & {
  multiple?: boolean
}

export function Group({children, multiple, ...props}: GroupProps) {
  const t = useTheme()
  return (
    <Toggle.Group type={multiple ? 'checkbox' : 'radio'} {...props}>
      <View
        style={[
          a.w_full,
          a.flex_row,
          a.rounded_sm,
          a.overflow_hidden,
          t.atoms.border_contrast_low,
          {borderWidth: 1},
        ]}>
        {children}
      </View>
    </Toggle.Group>
  )
}

export function Button({children, ...props}: ItemProps) {
  return (
    <Toggle.Item {...props} style={[a.flex_grow, a.flex_1]}>
      <ButtonInner>{children}</ButtonInner>
    </Toggle.Item>
  )
}

function ButtonInner({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const state = Toggle.useItemContext()

  const {baseStyles, hoverStyles, activeStyles} = React.useMemo(() => {
    const base: ViewStyle[] = []
    const hover: ViewStyle[] = []
    const active: ViewStyle[] = []

    hover.push(
      t.name === 'light' ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_25,
    )

    if (state.selected) {
      active.push({
        backgroundColor: t.palette.contrast_800,
      })
      hover.push({
        backgroundColor: t.palette.contrast_800,
      })

      if (state.disabled) {
        active.push({
          backgroundColor: t.palette.contrast_500,
        })
      }
    }

    if (state.disabled) {
      base.push({
        backgroundColor: t.palette.contrast_100,
      })
    }

    return {
      baseStyles: base,
      hoverStyles: hover,
      activeStyles: active,
    }
  }, [t, state])

  return (
    <View
      style={[
        {
          borderLeftWidth: 1,
          marginLeft: -1,
        },
        a.flex_grow,
        a.py_md,
        native({
          paddingBottom: 10,
        }),
        a.px_md,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        baseStyles,
        activeStyles,
        (state.hovered || state.pressed) && hoverStyles,
      ]}>
      {children}
    </View>
  )
}

export function ButtonText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const state = Toggle.useItemContext()

  const textStyles = React.useMemo(() => {
    const text: TextStyle[] = []
    if (state.selected) {
      text.push(t.atoms.text_inverted)
    }
    if (state.disabled) {
      text.push({
        opacity: 0.5,
      })
    }
    return text
  }, [t, state])

  return (
    <Text
      style={[
        a.text_center,
        a.font_bold,
        t.atoms.text_contrast_medium,
        textStyles,
      ]}>
      {children}
    </Text>
  )
}
