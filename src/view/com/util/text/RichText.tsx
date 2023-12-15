import React from 'react'
import {TextStyle, StyleProp} from 'react-native'
import {RichText as RichTextObj, AppBskyRichtextFacet} from '@atproto/api'
import {TextLink} from '../Link'
import {Text} from './Text'
import {lh} from 'lib/styles'
import {toShortUrl} from 'lib/strings/url-helpers'
import {useTheme, TypographyVariant} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'

const WORD_WRAP = {wordWrap: 1}

export function RichText({
  testID,
  type = 'md',
  richText,
  lineHeight = 1.2,
  style,
  numberOfLines,
}: {
  testID?: string
  type?: TypographyVariant
  richText?: RichTextObj
  lineHeight?: number
  style?: StyleProp<TextStyle>
  numberOfLines?: number
}) {
  const theme = useTheme()
  const pal = usePalette('default')
  const lineHeightStyle = lh(theme, type, lineHeight)

  if (!richText) {
    return null
  }

  const {text, facets} = richText
  if (!facets?.length) {
    if (/^\p{Extended_Pictographic}+$/u.test(text) && text.length <= 5) {
      style = {
        fontSize: 26,
        lineHeight: 30,
      }
      return (
        // @ts-ignore web only -prf
        <Text testID={testID} style={[style, pal.text]} dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        testID={testID}
        type={type}
        style={[style, pal.text, lineHeightStyle]}
        numberOfLines={numberOfLines}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }
  if (!style) {
    style = []
  } else if (!Array.isArray(style)) {
    style = [style]
  }

  const els = []
  let key = 0
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    if (mention && AppBskyRichtextFacet.validateMention(mention).success) {
      els.push(
        <TextLink
          key={key}
          type={type}
          text={segment.text}
          href={`/profile/${mention.did}`}
          style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}
          dataSet={WORD_WRAP}
        />,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      els.push(
        <TextLink
          key={key}
          type={type}
          text={toShortUrl(segment.text)}
          href={link.uri}
          style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}
          dataSet={WORD_WRAP}
          warnOnMismatchingLabel
        />,
      )
    } else {
      els.push(segment.text)
    }
    key++
  }
  return (
    <Text
      testID={testID}
      type={type}
      style={[style, pal.text, lineHeightStyle]}
      numberOfLines={numberOfLines}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}
