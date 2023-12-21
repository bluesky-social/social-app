import React from 'react'
import {Text as RNText, TextProps} from 'react-native'
import {useAlf, web} from '#/alf'

export function Text({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  return <RNText style={[styles.font.s, styles.color.l7, style]} {...rest} />
}

export function H1({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 1,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.xxl, styles.font.bold, styles.color.l7, style]}
    />
  )
}

export function H2({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 2,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.l, styles.font.bold, styles.color.l7, style]}
    />
  )
}

export function H3({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 3,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.m, styles.font.bold, styles.color.l7, style]}
    />
  )
}

export function H4({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 4,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.s, styles.font.bold, styles.color.l7, style]}
    />
  )
}

export function H5({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 5,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.xs, styles.font.bold, styles.color.l7, style]}
    />
  )
}

export function H6({style, ...rest}: TextProps) {
  const {styles} = useAlf()
  const attr =
    web({
      role: 'heading',
      'aria-level': 6,
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={[styles.font.xxs, styles.font.bold, styles.color.l7, style]}
    />
  )
}
