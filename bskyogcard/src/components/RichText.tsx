import React from 'react'
import {AppBskyRichtextFacet, RichText as RichTextApi} from '@atproto/api'

import {atoms as a, style as s, theme as t} from '../theme/index.js'
import {toShortUrl} from '../util/toShortUrl.js'
import {Text} from './Text.js'

export function RichText({
  value,
  disableLinks,
  cx = [],
}: {
  value: RichTextApi
  disableLinks?: boolean
  cx?: Record<string, any>[]
}) {
  const {text, facets} = value
  const baseStyles = [a.leading_snug, {whiteSpace: 'pre-wrap'}, ...cx]
  const linkStyles = [
    {
      color: t.palette.primary_500,
    },
  ]
  const fontSize: number = s(baseStyles).fontSize || a.text_sm.fontSize

  if (!facets?.length) {
    if (isOnlyEmoji(text)) {
      return (
        <Text cx={[...baseStyles, {fontSize: fontSize * 1.85}]}>{text}</Text>
      )
    }
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
        els.push(url)
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
          {text}
        </span>,
      )
    } else {
      els.push(text)
    }
    if (/\n/.test(text)) {
      els.push(<span key={key} style={{width: '100%'}} />)
    }
    key++
  }

  return <Text cx={baseStyles}>{els}</Text>
}

export function isOnlyEmoji(text: string) {
  return (
    text.length <= 15 &&
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(text)
  )
}
