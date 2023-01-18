import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {s} from '../../../lib/styles'
import {useTheme, TypographyVariant} from '../../../lib/ThemeContext'

export type CustomTextProps = TextProps & {
  type?: TypographyVariant
}

export function Text({
  type = 'md',
  children,
  style,
  ...props
}: React.PropsWithChildren<CustomTextProps>) {
  const theme = useTheme()
  const typography = theme.typography[type]
  return (
    <RNText style={[s.black, typography, style]} {...props}>
      {children}
    </RNText>
  )
}
