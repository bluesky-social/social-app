import React from 'react'
import {Text as RNText, TextProps} from 'react-native'

import {useTheme, atoms, web, flatten} from '#/alf'

/**
 * Util to calculate lineHeight from a text size atom and a leading atom
 *
 * Example:
 *   `leading(atoms.text_md, atoms.leading_normal)` // => 24
 */
export function leading<
  Size extends {fontSize?: number},
  Leading extends {lineHeight: number},
>(textSize: Size, leading: Leading) {
  return (textSize.fontSize || atoms.text_md.fontSize) * leading.lineHeight
}

export function Text({style, ...rest}: TextProps) {
  const t = useTheme()
  return <RNText style={[atoms.text_sm, t.atoms.text, style]} {...rest} />
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
      style={[atoms.text_5xl, atoms.font_bold, t.atoms.text, flatten(style)]}
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
      style={[atoms.text_4xl, atoms.font_bold, t.atoms.text, flatten(style)]}
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
      style={[atoms.text_3xl, atoms.font_bold, t.atoms.text, flatten(style)]}
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
      style={[atoms.text_2xl, atoms.font_bold, t.atoms.text, flatten(style)]}
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
      style={[atoms.text_xl, atoms.font_bold, t.atoms.text, flatten(style)]}
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
      style={[atoms.text_lg, atoms.font_bold, t.atoms.text, flatten(style)]}
    />
  )
}

export function P({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'paragraph',
    }) || {}
  const _style = flatten(style)
  const lineHeight = leading(
    // @ts-ignore
    _style?.fontSize ? _style : atoms.text_md,
    atoms.leading_normal,
  )
  return (
    <RNText
      {...attr}
      {...rest}
      style={[atoms.text_md, t.atoms.text, _style, {lineHeight}]}
    />
  )
}
