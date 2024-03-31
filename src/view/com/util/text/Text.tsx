import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {UITextView} from 'react-native-ui-text-view'

import {lh, s} from 'lib/styles'
import {TypographyVariant, useTheme} from 'lib/ThemeContext'
import {isIOS, isWeb} from 'platform/detection'

export type CustomTextProps = TextProps & {
  type?: TypographyVariant
  lineHeight?: number
  title?: string
  dataSet?: Record<string, string | number>
  selectable?: boolean
}

const fontFamilyStyle = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Liberation Sans", Helvetica, Arial, sans-serif',
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
      <UITextView
        style={[s.black, typography, lineHeightStyle, style]}
        {...props}>
        {children}
      </UITextView>
    )
  }

  return (
    <RNText
      style={[
        s.black,
        typography,
        isWeb && fontFamilyStyle,
        lineHeightStyle,
        style,
      ]}
      // @ts-ignore web only -esb
      dataSet={Object.assign({tooltip: title}, dataSet || {})}
      selectable={selectable}
      {...props}>
      {children}
    </RNText>
  )
}
