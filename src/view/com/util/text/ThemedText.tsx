import React from 'react'
import {CustomTextProps, Text} from './Text'
import {usePalette} from 'lib/hooks/usePalette'
import {addStyle} from 'lib/styles'

export type ThemedTextProps = CustomTextProps & {
  fg?: 'default' | 'light' | 'error' | 'inverted' | 'inverted-light'
  bg?: 'default' | 'light' | 'error' | 'inverted' | 'inverted-light'
  border?: 'default' | 'dark' | 'error' | 'inverted' | 'inverted-dark'
  lineHeight?: number
}

export function ThemedText({
  fg,
  bg,
  border,
  style,
  children,
  ...props
}: React.PropsWithChildren<ThemedTextProps>) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const palError = usePalette('error')
  switch (fg) {
    case 'default':
      style = addStyle(style, pal.text)
      break
    case 'light':
      style = addStyle(style, pal.textLight)
      break
    case 'error':
      style = addStyle(style, {color: palError.colors.background})
      break
    case 'inverted':
      style = addStyle(style, palInverted.text)
      break
    case 'inverted-light':
      style = addStyle(style, palInverted.textLight)
      break
  }
  switch (bg) {
    case 'default':
      style = addStyle(style, pal.view)
      break
    case 'light':
      style = addStyle(style, pal.viewLight)
      break
    case 'error':
      style = addStyle(style, palError.view)
      break
    case 'inverted':
      style = addStyle(style, palInverted.view)
      break
    case 'inverted-light':
      style = addStyle(style, palInverted.viewLight)
      break
  }
  switch (border) {
    case 'default':
      style = addStyle(style, pal.border)
      break
    case 'dark':
      style = addStyle(style, pal.borderDark)
      break
    case 'error':
      style = addStyle(style, palError.border)
      break
    case 'inverted':
      style = addStyle(style, palInverted.border)
      break
    case 'inverted-dark':
      style = addStyle(style, palInverted.borderDark)
      break
  }
  return (
    <Text style={style} {...props}>
      {children}
    </Text>
  )
}
