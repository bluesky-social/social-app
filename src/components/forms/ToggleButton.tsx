import React from 'react'
import {View, AccessibilityProps, TextStyle, ViewStyle} from 'react-native'

import {atoms as a, useTheme, native} from '#/alf'
import {Text} from '#/components/Typography'

import * as Toggle from '#/components/forms/Toggle'

export type ItemProps = Omit<Toggle.ItemProps, 'style' | 'role' | 'children'> &
  AccessibilityProps &
  React.PropsWithChildren<{}>

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
    <Toggle.Item {...props} style={[a.flex_grow]}>
      <ButtonInner>{children}</ButtonInner>
    </Toggle.Item>
  )
}

function ButtonInner({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const state = Toggle.useItemContext()

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
        {
          borderLeftWidth: 1,
          marginLeft: -1,
        },
        a.flex_grow,
        a.py_md,
        native({
          paddingBottom: 10,
        }),
        a.px_sm,
        t.atoms.bg,
        t.atoms.border,
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
