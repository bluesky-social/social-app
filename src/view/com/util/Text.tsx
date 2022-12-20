import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {s} from '../../lib/styles'

export function Text({
  children,
  style,
  ...props
}: React.PropsWithChildren<TextProps>) {
  return (
    <RNText style={[s.black, style]} {...props}>
      {children}
    </RNText>
  )
}
