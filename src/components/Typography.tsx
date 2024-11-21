import React from 'react'
import {TextProps as RNTextProps} from 'react-native'
import {UITextView} from 'react-native-uitextview'
import createEmojiRegex from 'emoji-regex'

import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {atoms, flatten, useAlf, useTheme, web} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {IS_DEV} from '#/env'

export type StringChild = string | (string | null)[]

export type TextProps = Omit<RNTextProps, 'children'> & {
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
} & (
    | {
        emoji?: true
        children: StringChild
      }
    | {
        emoji?: false
        children: RNTextProps['children']
      }
  )

const EMOJI = createEmojiRegex()

export function childHasEmoji(children: React.ReactNode) {
  return (Array.isArray(children) ? children : [children]).some(
    child => typeof child === 'string' && createEmojiRegex().test(child),
  )
}

export function childIsString(
  children: React.ReactNode,
): children is StringChild {
  return (
    typeof children === 'string' ||
    (Array.isArray(children) &&
      children.every(child => typeof child === 'string' || child === null))
  )
}

export function renderChildrenWithEmoji(
  children: StringChild,
  props: Omit<TextProps, 'children'> = {},
) {
  const normalized = Array.isArray(children) ? children : [children]

  return (
    <UITextView {...props}>
      {normalized.map(child => {
        if (typeof child !== 'string') return child

        const emojis = child.match(EMOJI)

        if (emojis === null) {
          return child
        }

        return child.split(EMOJI).map((stringPart, index) => (
          <UITextView key={index} {...props}>
            {stringPart}
            {emojis[index] ? (
              <UITextView
                {...props}
                style={[props?.style, {color: 'black', fontFamily: 'System'}]}>
                {emojis[index]}
              </UITextView>
            ) : null}
          </UITextView>
        ))
      })}
    </UITextView>
  )
}

/**
 * Our main text component. Use this most of the time.
 */
export function Text({
  children,
  emoji,
  style,
  selectable,
  title,
  dataSet,
  ...rest
}: TextProps) {
  const {fonts, flags} = useAlf()
  const t = useTheme()
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, flatten(style)], {
    fontScale: fonts.scaleMultiplier,
    fontFamily: fonts.family,
    flags,
  })

  if (IS_DEV) {
    if (!emoji && childHasEmoji(children)) {
      logger.warn(
        `Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
      )
    }

    if (emoji && !childIsString(children)) {
      logger.error('Text: when <Text emoji />, children can only be strings.')
    }
  }

  const shared = {
    uiTextView: true,
    selectable,
    style: s,
    dataSet: Object.assign({tooltip: title}, dataSet || {}),
    ...rest,
  }

  return (
    <UITextView {...shared}>
      {isIOS && emoji ? renderChildrenWithEmoji(children, shared) : children}
    </UITextView>
  )
}

function createHeadingElement({level}: {level: number}) {
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
