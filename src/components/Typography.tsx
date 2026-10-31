import {StyleSheet, type TextStyle} from 'react-native'
import {UITextView} from '@bsky.app/react-native-uitextview'

import {logger} from '#/logger'
import {atoms as a, useAlf, useTheme, web} from '#/alf'
import {
  childHasEmoji,
  getTextStyleOverrides,
  normalizeTextStyles,
  renderChildrenWithEmoji,
  type TextProps,
} from '#/alf/typography'
import {IS_WEB} from '#/env'

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
  numberOfLines,
  allowFontScaling = true,
  ...rest
}: TextProps) {
  const {fonts, flags} = useAlf()
  const t = useTheme()
  const input = [
    a.text_sm,
    t.atoms.text,
    a.leading_snug,
    web(numberOfLines === 1 && styles.numberOfLinesClippingFix),
    style,
  ]
  const options = {
    fontScale: allowFontScaling ? fonts.scaleMultiplier : 1,
    fontFamily: fonts.family,
    flags,
  }
  /*
   * On web, keep the original style objects and add only the computed props,
   * so atoms render as CSS classes rather than one flattened inline style.
   * Native has no classes, so it keeps the flattened style.
   */
  const s = IS_WEB
    ? [input, internTextStyle(getTextStyleOverrides(input, options))]
    : normalizeTextStyles(input, options)

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
    numberOfLines,
    style: s,
    dataSet: Object.assign({tooltip: title}, dataSet || {}),
    allowFontScaling,
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
    <Text {...attr} {...rest} style={[a.text_md, a.leading_relaxed, style]} />
  )
}

/**
 * HACKFIX: React Native Web applies `overflow: hidden` to
 * text when using the `numberOfLines` prop, which causes it to clip
 * ascenders/descenders. It only needs to be doing this for the X axis,
 * so override the style with `overflowX: 'hidden'`.
 * Note this only works for `numberOfLines={1}` -sfn
 *
 * @see https://github.com/necolas/react-native-web/pull/2836
 */
const styles = StyleSheet.create({
  numberOfLinesClippingFix: {
    overflowY: 'visible',
    overflowX: 'clip',
    // mimic browser default behavior of `min-width: 0` on `overflow: hidden`
    // elements to allow text to shrink smaller than its intrinsic width when
    // necessary
    minWidth: 0,
    // this is neater and supports vertical writing modes, but it's only baseline newly available
    // overflowInline: 'clip',
  } satisfies React.CSSProperties as TextStyle,
})

const MAX_INTERNED_TEXT_STYLES = 500
const internedTextStyles = new Map<string, TextStyle>()

/**
 * Text's computed props take few distinct values (one per font size, leading
 * and family), so each combination is created once and reused, which on web
 * makes it a CSS class too. Past a cap, e.g. if something animates a font
 * size, new combinations are returned as-is and render inline.
 */
function internTextStyle(style: TextStyle) {
  const key = JSON.stringify(style)
  let interned = internedTextStyles.get(key)
  if (!interned) {
    if (internedTextStyles.size >= MAX_INTERNED_TEXT_STYLES) return style
    interned = StyleSheet.create({style}).style
    internedTextStyles.set(key, interned)
  }
  return interned
}
