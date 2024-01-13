import React from 'react'
import {StyleSheet, Text as RNText, TextProps} from 'react-native'
import {s, lh} from 'lib/styles'
import {useTheme, TypographyVariant} from 'lib/ThemeContext'
import {SelectableText} from '../../../../../modules/expo-selectable-text'
import {isIOS} from 'platform/detection'

export type CustomTextProps = TextProps & {
  type?: TypographyVariant
  lineHeight?: number
  title?: string
  dataSet?: Record<string, string | number>
  selectable?: boolean
}

export function Text({
  type = 'md',
  children,
  lineHeight,
  style,
  title,
  dataSet,
  selectable,
  ...props
}: React.PropsWithChildren<CustomTextProps>) {
  const theme = useTheme()
  const typography = theme.typography[type]
  const lineHeightStyle = lineHeight ? lh(theme, type, lineHeight) : undefined

  // if (false) {
  // TODO remove
  if (selectable && isIOS) {
    return (
      <SelectableText
        selectable
        style={StyleSheet.flatten([
          s.black,
          typography,
          lineHeightStyle,
          style,
        ])}>
        {children}
      </SelectableText>
    )
  }

  return (
    <RNText
      style={[s.black, typography, lineHeightStyle, style]}
      // @ts-ignore web only -esb
      dataSet={Object.assign({tooltip: title}, dataSet || {})}
      {...props}>
      {children}
    </RNText>
  )
}
