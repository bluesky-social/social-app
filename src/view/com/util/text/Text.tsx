import React from 'react'
import {StyleSheet, type TextProps} from 'react-native'
import {UITextView} from 'react-native-uitextview'

import {lh, s} from '#/lib/styles'
import {type TypographyVariant, useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {applyFonts, useAlf} from '#/alf'
import {
  childHasEmoji,
  renderChildrenWithEmoji,
  type StringChild,
} from '#/alf/typography'
import {IS_IOS, IS_WEB} from '#/env'

export type CustomTextProps = Omit<TextProps, 'children'> & {
  type?: TypographyVariant
  lineHeight?: number
  title?: string
  dataSet?: Record<string, string | number>
  selectable?: boolean
} & (
    | {
        emoji: true
        children: StringChild
      }
    | {
        emoji?: false
        children: TextProps['children']
      }
  )

export {Text_DEPRECATED as Text}
/**
 * @deprecated use Text from `#/components/Typography.tsx` instead
 */
function Text_DEPRECATED({
  type = 'md',
  children,
  emoji,
  lineHeight,
  style,
  title,
  dataSet,
  selectable,
  ...props
}: React.PropsWithChildren<CustomTextProps>) {
  const theme = useTheme()
  const {fonts} = useAlf()

  if (__DEV__) {
    if (!emoji && childHasEmoji(children)) {
      logger.warn(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        `Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
      )
    }
  }

  const textProps = React.useMemo(() => {
    const typography = theme.typography[type]
    const lineHeightStyle = lineHeight ? lh(theme, type, lineHeight) : undefined

    const flattened = StyleSheet.flatten([
      s.black,
      typography,
      lineHeightStyle,
      style,
    ])

    applyFonts(flattened, fonts.family)

    // should always be defined on `typography`
    // @ts-ignore
    if (flattened.fontSize) {
      // @ts-ignore
      flattened.fontSize = Math.round(
        // @ts-ignore
        flattened.fontSize * fonts.scaleMultiplier,
      )
    }

    return {
      uiTextView: selectable && IS_IOS,
      selectable,
      style: flattened,
      dataSet: IS_WEB
        ? Object.assign({tooltip: title}, dataSet || {})
        : undefined,
      ...props,
    }
  }, [
    dataSet,
    fonts.family,
    fonts.scaleMultiplier,
    lineHeight,
    props,
    selectable,
    style,
    theme,
    title,
    type,
  ])

  return (
    <UITextView {...textProps}>
      {renderChildrenWithEmoji(children, textProps, emoji ?? false)}
    </UITextView>
  )
}
