import React from 'react'
import {type TextStyle} from 'react-native'
import {AppBskyRichtextFacet, RichText as RichTextAPI} from '@atproto/api'

import {toShortUrl} from '#/lib/strings/url-helpers'
import {atoms as a, flatten, type TextStyleProp} from '#/alf'
import {isOnlyEmoji} from '#/alf/typography'
import {CodeBlockText} from '#/components/CodeBlock'
import {InlineLinkText, type LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichTextTag} from '#/components/RichTextTag'
import {Text, type TextProps} from '#/components/Typography'

const WORD_WRAP = {wordWrap: 1}

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    enableTags?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: TextStyle
    emojiMultiplier?: number
    shouldProxyLinks?: boolean
  }

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  selectable,
  enableTags = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
  onLayout,
  onTextLayout,
  shouldProxyLinks,
}: RichTextProps) {
  const richText = React.useMemo(
    () =>
      value instanceof RichTextAPI ? value : new RichTextAPI({text: value}),
    [value],
  )

  const flattenedStyle = flatten(style)
  const plainStyles = [a.leading_snug, flattenedStyle]
  const interactiveStyles = [
    a.leading_snug,
    flatten(interactiveStyle),
    flattenedStyle,
  ]

  const {text, facets} = richText

  if (!facets?.length) {
    const fencedRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g
    const matches = [...text.matchAll(fencedRegex)]
    if (matches.length > 0) {
      const els = [] as React.ReactNode[]
      let lastIndex = 0
      let key = 0
      for (const m of matches) {
        const start = m.index || 0
        const end = start + m[0].length
        if (start > lastIndex) {
          els.push(text.slice(lastIndex, start))
        }
        const lang = (m[1] || '').trim() || undefined
        const code = m[2] || ''
        els.push(<CodeBlockText key={`cb-${key++}`} code={code} lang={lang} />)
        lastIndex = end
      }
      if (lastIndex < text.length) {
        els.push(text.slice(lastIndex))
      }
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={plainStyles}
          numberOfLines={numberOfLines}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {els}
        </Text>
      )
    }
    if (isOnlyEmoji(text)) {
      const fontSize =
        (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
      return (
        <Text
          emoji
          selectable={selectable}
          testID={testID}
          style={[plainStyles, {fontSize}]}
          onLayout={onLayout}
          onTextLayout={onTextLayout}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        emoji
        selectable={selectable}
        testID={testID}
        style={plainStyles}
        numberOfLines={numberOfLines}
        onLayout={onLayout}
        onTextLayout={onTextLayout}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }

  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    const tag = segment.tag
    if (
      mention &&
      AppBskyRichtextFacet.validateMention(mention).success &&
      !disableLinks
    ) {
      els.push(
        <ProfileHoverCard key={key} did={mention.did}>
          <InlineLinkText
            selectable={selectable}
            to={`/profile/${mention.did}`}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}>
            {segment.text}
          </InlineLinkText>
        </ProfileHoverCard>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      if (disableLinks) {
        els.push(toShortUrl(segment.text))
      } else {
        els.push(
          <InlineLinkText
            selectable={selectable}
            key={key}
            to={link.uri}
            style={interactiveStyles}
            // @ts-ignore TODO
            dataSet={WORD_WRAP}
            shareOnLongPress
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}
            emoji>
            {toShortUrl(segment.text)}
          </InlineLinkText>,
        )
      }
    } else if (
      !disableLinks &&
      enableTags &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <RichTextTag
          key={key}
          display={segment.text}
          tag={tag.tag}
          textStyle={interactiveStyles}
          authorHandle={authorHandle}
        />,
      )
    } else {
      els.push(segment.text)
    }
    key++
  }

  return (
    <Text
      emoji
      selectable={selectable}
      testID={testID}
      style={plainStyles}
      numberOfLines={numberOfLines}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}
