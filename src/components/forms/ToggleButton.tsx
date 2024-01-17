import React from 'react'
import {View, AccessibilityProps, TextStyle, ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

import Toggle, {
  GroupProps as BaseGroupProps,
  ItemProps as BaseItemProps,
  useItemContext,
} from '#/components/forms/Toggle'

export type ItemProps = Omit<BaseItemProps, 'style' | 'role' | 'children'> &
  AccessibilityProps &
  React.PropsWithChildren<{}>

export type GroupProps = Omit<BaseGroupProps, 'style' | 'type'> & {
  multiple?: boolean
}

export function Group({children, multiple, ...props}: GroupProps) {
  const t = useTheme()
  return (
    <Toggle.Group type={multiple ? 'checkbox' : 'radio'} {...props}>
      <View
        style={[
          a.flex_row,
          a.border,
          a.rounded_sm,
          a.overflow_hidden,
          t.atoms.border,
        ]}>
        {children}
      </View>
    </Toggle.Group>
  )
}

export function Button({children, ...props}: ItemProps) {
  return (
    <Toggle.Item {...props}>
      <ButtonInner>{children}</ButtonInner>
    </Toggle.Item>
  )
}

function ButtonInner({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const state = useItemContext()

  const {baseStyles, hoverStyles, activeStyles, textStyles} =
    React.useMemo(() => {
      const base: ViewStyle[] = []
      const hover: ViewStyle[] = []
      const active: ViewStyle[] = []
      const text: TextStyle[] = []

      hover.push(
        t.name === 'light' ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_25,
      )

      if (state.selected) {
        active.push({
          backgroundColor: t.palette.contrast_800,
        })
        text.push(t.atoms.text_inverted)
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
        text.push({
          opacity: 0.5,
        })
      }

      return {
        baseStyles: base,
        hoverStyles: hover,
        activeStyles: active,
        textStyles: text,
      }
    }, [t, state])

  return (
    <View
      style={[
        a.px_lg,
        a.py_md,
        t.atoms.bg,
        t.atoms.border,
        {
          borderLeftWidth: 1,
          marginLeft: -1,
        },
        baseStyles,
        activeStyles,
        (state.hovered || state.focused || state.pressed) && hoverStyles,
      ]}>
      {typeof children === 'string' ? (
        <Text
          style={[
            a.text_center,
            a.font_bold,
            t.atoms.text_contrast_500,
            textStyles,
          ]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}

export default {
  Group,
  Button,
}
