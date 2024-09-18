import React from 'react'
import {StyleProp, TextProps as RNTextProps, TextStyle} from 'react-native'
import {UITextView} from 'react-native-uitextview'

import {isNative} from '#/platform/detection'
import {Alf, applyFonts, atoms, flatten, useAlf, useTheme, web} from '#/alf'

export type TextProps = RNTextProps & {
  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean
}

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
  return Math.round(size * lineHeight)
}

/**
 * Ensures that `lineHeight` defaults to a relative value of `1`, or applies
 * other relative leading atoms.
 *
 * If the `lineHeight` value is > 2, we assume it's an absolute value and
 * returns it as-is.
 */
export function normalizeTextStyles(
  styles: StyleProp<TextStyle>,
  {
    fontScale,
    fontFamily,
  }: {
    fontScale: number
    fontFamily: Alf['fonts']['family']
  } & Pick<Alf, 'flags'>,
) {
  const s = flatten(styles)
  // should always be defined on these components
  s.fontSize = (s.fontSize || atoms.text_md.fontSize) * fontScale

  if (s?.lineHeight) {
    if (s.lineHeight !== 0 && s.lineHeight <= 2) {
      s.lineHeight = Math.round(s.fontSize * s.lineHeight)
    }
  } else if (!isNative) {
    s.lineHeight = s.fontSize
  }

  applyFonts(s, fontFamily)

  return s
}

/**
 * Our main text component. Use this most of the time.
 */
export function Text({style, selectable, ...rest}: TextProps) {
  const {fonts, flags} = useAlf()
  const t = useTheme()
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, flatten(style)], {
    fontScale: fonts.scaleMultiplier,
    fontFamily: fonts.family,
    flags,
  })

  return <UITextView selectable={selectable} uiTextView style={s} {...rest} />
}

export function createHeadingElement({level}: {level: number}) {
  return function HeadingElement({style, ...rest}: TextProps) {
    const attr =
      web({
        role: 'heading',
        'aria-level': level,
      }) || {}
    return <Text {...attr} {...rest} style={style} />
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
  const attr =
    web({
      role: 'paragraph',
    }) || {}
  return (
    <Text
      {...attr}
      {...rest}
      style={[atoms.text_md, atoms.leading_normal, flatten(style)]}
    />
  )
}
