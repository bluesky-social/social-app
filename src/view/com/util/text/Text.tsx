import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {s, lh} from 'lib/styles'
import {useTheme, TypographyVariant} from 'lib/ThemeContext'
import {isIOS} from 'platform/detection'
import ExpoSelectableTextView from '../../../../../modules/expo-selectable-text/src/ExpoUITextView'

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

  if (selectable && isIOS) {
    return (
      <ExpoSelectableTextView
        style={[s.black, typography, lineHeightStyle, style]}
        {...props}>
        {children}
      </ExpoSelectableTextView>
    )
  }

  return (
    <RNText
      style={[s.black, typography, lineHeightStyle, style]}
      // @ts-ignore web only -esb
      dataSet={Object.assign({tooltip: title}, dataSet || {})}
      selectable={selectable}
      {...props}>
      {children}
    </RNText>
  )
}
