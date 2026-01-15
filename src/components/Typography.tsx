import {UITextView} from 'react-native-uitextview'

import {logger} from '#/logger'
import {atoms, useAlf, useTheme, web} from '#/alf'
import {
  childHasEmoji,
  normalizeTextStyles,
  renderChildrenWithEmoji,
  type TextProps,
} from '#/alf/typography'

export type {TextProps}
export {Text as Span} from 'react-native'

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
  const s = normalizeTextStyles([atoms.text_sm, t.atoms.text, style], {
    fontScale: fonts.scaleMultiplier,
    fontFamily: fonts.family,
    flags,
  })

  if (__DEV__) {
    if (!emoji && childHasEmoji(children)) {
      logger.warn(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        `Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
      )
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
      {renderChildrenWithEmoji(children, shared, emoji ?? false)}
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
      style={[atoms.text_md, atoms.leading_relaxed, style]}
    />
  )
}
