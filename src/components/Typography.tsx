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

/**
 * Our main text component. Use this most of the time.
 */
export function Text({style, ...rest}: TextProps) {
  const t = useTheme()
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, flatten(style)])
  return <RNText style={s} {...rest} />
}

export function createHeadingElement({level}: {level: number}) {
  return function HeadingElement({style, ...rest}: TextProps) {
    const t = useTheme()
    const attr =
      web({
        role: 'heading',
        'aria-level': level,
      }) || {}
    return (
      <RNText
        {...attr}
        {...rest}
        style={normalizeTextStyles([t.atoms.text, flatten(style)])}
      />
    )
  }
}

/*
 * Use semantic components when it's beneficial to the user or to a web scraper
 */
export const H1 = createHeadingElement({level: 1})
export const H2 = createHeadingElement({level: 2})
export const H3 = createHeadingElement({level: 3})
export const H4 = createHeadingElement({level: 4})
export const H5 = createHeadingElement({level: 5})
export const H6 = createHeadingElement({level: 6})
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
