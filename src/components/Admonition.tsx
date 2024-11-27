import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Eye_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/Eye'
import {Leaf_Stroke2_Corner0_Rounded as TipIcon} from '#/components/icons/Leaf'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Text as BaseText, TextProps} from '#/components/Typography'

export const colors = {
  warning: {
    light: '#DFBC00',
    dark: '#BFAF1F',
  },
}

type Context = {
  type: 'info' | 'tip' | 'warning' | 'error'
}

const Context = React.createContext<Context>({
  type: 'info',
})

export function Icon() {
  const t = useTheme()
  const {type} = React.useContext(Context)
  const Icon = {
    info: InfoIcon,
    tip: TipIcon,
    warning: WarningIcon,
    error: ErrorIcon,
  }[type]
  const fill = {
    info: t.atoms.text_contrast_medium.color,
    tip: t.palette.primary_500,
    warning: colors.warning.light,
    error: t.palette.negative_500,
  }[type]
  return <Icon fill={fill} size="md" />
}

export function Text({
  children,
  style,
  ...rest
}: Pick<TextProps, 'children' | 'style'>) {
  return (
    <BaseText
      {...rest}
      style={[
        a.flex_1,
        a.text_sm,
        a.leading_snug,
        {
          paddingTop: 1,
        },
        style,
      ]}>
      {children}
    </BaseText>
  )
}

export function Row({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_row, a.gap_sm]}>{children}</View>
}

export function Outer({
  children,
  type = 'info',
  style,
}: {
  children: React.ReactNode
  type?: Context['type']
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const borderColor = {
    info: t.atoms.border_contrast_low.borderColor,
    tip: t.atoms.border_contrast_low.borderColor,
    warning: t.atoms.border_contrast_low.borderColor,
    error: t.atoms.border_contrast_low.borderColor,
  }[type]
  return (
    <Context.Provider value={{type}}>
      <View
        style={[
          gtMobile ? a.p_md : a.p_sm,
          a.rounded_sm,
          a.border,
          t.atoms.bg_contrast_25,
          {borderColor},
          style,
        ]}>
        {children}
      </View>
    </Context.Provider>
  )
}

export function Admonition({
  children,
  type,
  style,
}: {
  children: TextProps['children']
  type?: Context['type']
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Outer type={type} style={style}>
      <Row>
        <Icon />
        <Text>{children}</Text>
      </Row>
    </Outer>
  )
}
