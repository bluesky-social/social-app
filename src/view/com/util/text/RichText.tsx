import React from 'react'
import {TextStyle, StyleProp} from 'react-native'
import {RichText as RichTextObj, AppBskyRichtextFacet} from '@atproto/api'
import {TextLink} from '../Link'
import {Text} from './Text'
import {lh} from 'lib/styles'
import {toShortUrl} from 'lib/strings/url-helpers'
import {useTheme, TypographyVariant} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {makeTagLink} from 'lib/routes/links'
import {TagMenu, useTagMenuControl} from '#/components/TagMenu'
import {isNative} from '#/platform/detection'

const WORD_WRAP = {wordWrap: 1}

/**
 * @deprecated use `#/components/RichText`
 */
export function RichText({
  testID,
  type = 'md',
  richText,
  lineHeight = 1.2,
  style,
  numberOfLines,
  selectable,
  noLinks,
}: {
  testID?: string
  type?: TypographyVariant
  richText?: RichTextObj
  lineHeight?: number
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  selectable?: boolean
  noLinks?: boolean
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
        <Text
          testID={testID}
          style={[style, pal.text]}
          dataSet={WORD_WRAP}
          selectable={selectable}>
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
        dataSet={WORD_WRAP}
        selectable={selectable}>
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
    const tag = segment.tag
    if (
      !noLinks &&
      mention &&
      AppBskyRichtextFacet.validateMention(mention).success
    ) {
      els.push(
        <TextLink
          key={key}
          type={type}
          text={segment.text}
          href={`/profile/${mention.did}`}
          style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}
          dataSet={WORD_WRAP}
          selectable={selectable}
        />,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      if (noLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <TextLink
            key={key}
            type={type}
            text={toShortUrl(segment.text)}
            href={link.uri}
            style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}
            dataSet={WORD_WRAP}
            selectable={selectable}
          />,
        )
      }
    } else if (
      !noLinks &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <RichTextTag
          key={key}
          text={segment.text}
          type={type}
          style={style}
          lineHeightStyle={lineHeightStyle}
          selectable={selectable}
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
      dataSet={WORD_WRAP}
      selectable={selectable}>
      {els}
    </Text>
  )
}

function RichTextTag({
  text: tag,
  type,
  style,
  lineHeightStyle,
  selectable,
}: {
  text: string
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  lineHeightStyle?: TextStyle
  selectable?: boolean
}) {
  const pal = usePalette('default')
  const control = useTagMenuControl()

  const open = React.useCallback(() => {
    control.open()
  }, [control])

  return (
    <React.Fragment>
      <TagMenu control={control} tag={tag}>
        {isNative ? (
          <TextLink
            type={type}
            text={tag}
            // segment.text has the leading "#" while tag.tag does not
            href={makeTagLink(tag)}
            style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}
            dataSet={WORD_WRAP}
            selectable={selectable}
            onPress={open}
          />
        ) : (
          <Text
            selectable={selectable}
            type={type}
            style={[style, lineHeightStyle, pal.link, {pointerEvents: 'auto'}]}>
            {tag}
          </Text>
        )}
      </TagMenu>
    </React.Fragment>
  )
}
