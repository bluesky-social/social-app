import React from 'react'
import {View, AccessibilityProps} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

import Toggle, {
  GroupProps as BaseGroupProps,
  ItemProps as BaseItemProps,
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
  const t = useTheme()
  return (
    <Toggle.Item {...props}>
      {state => (
        <View
          style={[
            a.px_lg,
            a.py_md,
            t.atoms.bg,
            t.atoms.border,
            {
              borderLeftWidth: 1,
              marginLeft: -1, // TODO yuck
              backgroundColor: state.selected ? t.palette.black : undefined,
            },
          ]}>
          {typeof children === 'string' ? (
            <Text
              style={[
                a.text_center,
                a.font_bold,
                state.selected
                  ? t.atoms.text_inverted
                  : t.atoms.text_contrast_500,
              ]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Toggle.Item>
  )
}

export default {
  Group,
  Button,
}
