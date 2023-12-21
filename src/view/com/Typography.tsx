import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {useTheme, atoms, web} from '#/alf'

export function Text({style, ...rest}: TextProps) {
  const t = useTheme()
  return <RNText style={[atoms.font.s, t.atoms.color.l7, style]} {...rest} />
}

export function H1({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 1,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.xxl, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}

export function H2({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 2,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.l, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}

export function H3({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 3,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.m, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}

export function H4({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 4,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.s, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}

export function H5({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 5,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.xs, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}

export function H6({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'heading',
      'aria-level': 6,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.font.xxs, atoms.font.bold, t.atoms.color.l7, style]}
    />
  )
}
