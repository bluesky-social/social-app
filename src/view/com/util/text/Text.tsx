import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {s, lh} from 'lib/styles'
import {useTheme, TypographyVariant} from 'lib/ThemeContext'
import {useLanguagePrefs} from '#/state/preferences'
import {sanitizeAppLanguageSetting} from '#/locale/helpers'

export type CustomTextProps = TextProps & {
  type?: TypographyVariant
  lineHeight?: number
  title?: string
  dataSet?: Record<string, string | number>
  lang?: string
}

export function Text({
  type = 'md',
  children,
  lineHeight,
  style,
  title,
  dataSet,
  lang,
  ...props
}: React.PropsWithChildren<CustomTextProps>) {
  const theme = useTheme()
  const typography = theme.typography[type]
  const lineHeightStyle = lineHeight ? lh(theme, type, lineHeight) : undefined
  const {appLanguage} = useLanguagePrefs()
  const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage)
  return (
    <RNText
      style={[s.black, typography, lineHeightStyle, style]}
      // @ts-ignore web only -esb
      dataSet={Object.assign({tooltip: title}, dataSet || {})}
      lang={sanitizedLanguage === lang ? undefined : lang}
      {...props}>
      {children}
    </RNText>
  )
}
