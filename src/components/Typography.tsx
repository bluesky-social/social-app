import {UITextView} from 'react-native-uitextview'

import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {atoms, flatten, useAlf, useTheme, web} from '#/alf'
import {
  childHasEmoji,
  childIsString,
  normalizeTextStyles,
  renderChildrenWithEmoji,
  TextProps,
} from '#/alf/typography'
import {IS_DEV} from '#/env'
export type {TextProps}

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
