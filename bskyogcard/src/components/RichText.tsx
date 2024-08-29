import React from 'react'
import {AppBskyRichtextFacet, RichText as RichTextApi} from '@atproto/api'

import {atoms as a, style as s, theme as t} from '../theme/index.js'
import {toShortUrl} from '../util/toShortUrl.js'
import {Text} from './Text.js'

export function RichText({
  value,
  disableLinks,
  cx,
}: {
  value: RichTextApi
  disableLinks?: boolean
  cx?: Record<string, any>[]
}) {
  const {facets} = value
  const baseStyles = [
    a.leading_snug,
    {
      // whiteSpace: 'wrap',
    },
    cx ? s(cx) : {},
  ]
  const linkStyles = [
    {
      color: t.palette.primary_500,
    },
  ]

  if (!facets?.length) {
    // if (isOnlyEmoji(text)) {
    //   const fontSize =
    //     (flattenedStyle.fontSize ?? a.text_sm.fontSize) * emojiMultiplier
    //   return (
    //     <Text
    //       selectable={selectable}
    //       testID={testID}
    //       style={[baseStyles, {fontSize}]}
    //       // @ts-ignore web only -prf
    //       dataSet={WORD_WRAP}>
    //       {text}
    //     </Text>
    //   )
    // }
  }

  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of value.segments()) {
    const {text, link, mention, tag} = segment
    if (
      mention &&
      AppBskyRichtextFacet.validateMention(mention).success &&
      !disableLinks
    ) {
      els.push(
        <span key={key} style={s(linkStyles)}>
          {text}
        </span>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      const url = toShortUrl(text)
      if (disableLinks) {
        els.push(<span key={key}>{url}</span>)
      } else {
        els.push(
          <span key={key} style={s(linkStyles)}>
            {url}
          </span>,
        )
      }
    } else if (
      !disableLinks &&
      tag &&
      AppBskyRichtextFacet.validateTag(tag).success
    ) {
      els.push(
        <span key={key} style={s(linkStyles)}>
          {segment.text}
        </span>,
      )
    } else {
      els.push(<span key={key}>{segment.text}</span>)
    }
    key++
  }

  return <Text cx={baseStyles}>{els}</Text>
}
