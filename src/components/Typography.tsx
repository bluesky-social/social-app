import React from 'react'
import {Text as RNText, TextStyle, TextProps} from 'react-native'

import {useTheme, atoms, web, flatten} from '#/alf'

/**
 * Util to calculate lineHeight from a text size atom and a leading atom
 *
 * Example:
 *   `leading(atoms.text_md, atoms.leading_normal)` // => 24
 */
export function leading<
  Size extends {fontSize?: number},
  Leading extends {lineHeight?: number},
>(textSize: Size, leading: Leading) {
  const size = textSize?.fontSize || atoms.text_md.fontSize
  const lineHeight = leading?.lineHeight || atoms.leading_normal.lineHeight
  return size * lineHeight
}

/**
 * Ensures that `lineHeight` defaults to a relative value of `1`, or applies
 * other relative leading atoms.
 *
 * If the `lineHeight` value is > 2, we assume it's an absolute value and
 * returns it as-is.
 */
function normalizeTextStyles(styles: TextStyle[]) {
  const s = flatten(styles)
  // should always be defined on these components
  const fontSize = s.fontSize || atoms.text_md.fontSize

  if (s?.lineHeight) {
    if (s.lineHeight <= 2) {
      s.lineHeight = fontSize * s.lineHeight
    }
  } else {
    s.lineHeight = fontSize
  }

  return s
}

export function Text({style, ...rest}: TextProps) {
  const t = useTheme()
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, flatten(style)])
  return <RNText style={s} {...rest} />
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
      style={normalizeTextStyles([
        atoms.text_5xl,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
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
      style={normalizeTextStyles([
        atoms.text_4xl,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
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
      style={normalizeTextStyles([
        atoms.text_3xl,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
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
      style={normalizeTextStyles([
        atoms.text_2xl,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
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
      style={normalizeTextStyles([
        atoms.text_xl,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
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
      style={normalizeTextStyles([
        atoms.text_lg,
        atoms.font_bold,
        t.atoms.text,
        flatten(style),
      ])}
    />
  )
}

export function P({style, ...rest}: TextProps) {
  const t = useTheme()
  const attr =
    web({
      role: 'paragraph',
    }) || {}
  return (
    <RNText
      {...attr}
      {...rest}
      style={normalizeTextStyles([
        atoms.text_md,
        atoms.leading_normal,
        t.atoms.text,
        flatten(style),
      ])}
    />
  )
}
