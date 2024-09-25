import React from 'react'
import {StyleSheet, Text as RNText, TextProps} from 'react-native'
import {UITextView} from 'react-native-uitextview'

import {lh, s} from 'lib/styles'
import {TypographyVariant, useTheme} from 'lib/ThemeContext'
import {isIOS, isWeb} from 'platform/detection'
import {applyFonts, useAlf} from '#/alf'

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
  const {fonts} = useAlf()

  if (selectable && isIOS) {
    const flattened = StyleSheet.flatten([
      s.black,
      typography,
      lineHeightStyle,
      style,
    ])

    applyFonts(flattened, fonts.family)

    // should always be defined on `typography`
    // @ts-ignore
    if (flattened.fontSize) {
      // @ts-ignore
      flattened.fontSize = flattened.fontSize * fonts.scaleMultiplier
    }

    return (
      <UITextView
        style={flattened}
        selectable={selectable}
        uiTextView
        {...props}>
        {children}
      </UITextView>
    )
  }

  const flattened = StyleSheet.flatten([
    s.black,
    typography,
    isWeb && fontFamilyStyle,
    lineHeightStyle,
    style,
  ])

  applyFonts(flattened, fonts.family)

  // should always be defined on `typography`
  // @ts-ignore
  if (flattened.fontSize) {
    // @ts-ignore
    flattened.fontSize = flattened.fontSize * fonts.scaleMultiplier
  }

  return (
    <RNText
      style={flattened}
      // @ts-ignore web only -esb
      dataSet={Object.assign({tooltip: title}, dataSet || {})}
      selectable={selectable}
      {...props}>
      {children}
    </RNText>
  )
}
