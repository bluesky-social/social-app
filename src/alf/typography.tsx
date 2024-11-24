import React, {Children} from 'react'
import {TextProps as RNTextProps} from 'react-native'
import {StyleProp, TextStyle} from 'react-native'
import {UITextView} from 'react-native-uitextview'
import createEmojiRegex from 'emoji-regex'

import {isNative} from '#/platform/detection'
import {isIOS} from '#/platform/detection'
import {Alf, applyFonts, atoms, flatten} from '#/alf'

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

export type StringChild = string | (string | null)[]
export type TextProps = RNTextProps & {
  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean
  /**
   * Provides `data-*` attributes to the underlying `UITextView` component on
   * web only.
   */
  dataSet?: Record<string, string | number | undefined>
  /**
   * Appears as a small tooltip on web hover.
   */
  title?: string
  /**
   * Whether the children could possibly contain emoji.
   */
  emoji?: boolean
}

const EMOJI = createEmojiRegex()

export function childHasEmoji(children: React.ReactNode) {
  let hasEmoji = false
  Children.forEach(children, child => {
    if (typeof child === 'string' && createEmojiRegex().test(child)) {
      hasEmoji = true
    }
  })
  return hasEmoji
}

export function renderChildrenWithEmoji(
  children: React.ReactNode,
  props: Omit<TextProps, 'children'> = {},
  emoji: boolean,
) {
  if (!isIOS || !emoji) {
    return children
  }
  return Children.map(children, child => {
    if (typeof child !== 'string') return child

    const emojis = child.match(EMOJI)

    if (emojis === null) {
      return child
    }

    return child.split(EMOJI).map((stringPart, index) => [
      stringPart,
      emojis[index] ? (
        <UITextView
          {...props}
          style={[props?.style, {color: 'black', fontFamily: 'System'}]}>
          {emojis[index]}
        </UITextView>
      ) : null,
    ])
  })
}

const SINGLE_EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u
export function isOnlyEmoji(text: string) {
  return text.length <= 15 && SINGLE_EMOJI_RE.test(text)
}
