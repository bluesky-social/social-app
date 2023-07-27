import React from 'react'
import {StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {AppBskyEmbedImages, AppBskyEmbedRecordWithMedia} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {PostMeta} from '../PostMeta'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/models/ui/shell'
import {PostEmbeds} from '.'
import {makeProfileLink} from 'lib/routes/links'

export function QuoteEmbed({
  quote,
  style,
}: {
  quote: ComposerOptsQuote
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey)
  const itemTitle = `Post by ${quote.author.handle}`
  const isEmpty = React.useMemo(
    () => quote.text.trim().length === 0,
    [quote.text],
  )
  const imagesEmbed = React.useMemo(
    () =>
      quote.embeds?.find(
        embed =>
          AppBskyEmbedImages.isView(embed) ||
          AppBskyEmbedRecordWithMedia.isView(embed),
      ),
    [quote.embeds],
  )
  return (
    <Link
      style={[styles.container, pal.borderDark, style]}
      href={itemHref}
      title={itemTitle}>
      <PostMeta
        author={quote.author}
        showAvatar
        authorHasWarning={false}
        postHref={itemHref}
        timestamp={quote.indexedAt}
      />
      {!isEmpty ? (
        <Text type="post-text" style={pal.text} numberOfLines={6}>
          {quote.text}
        </Text>
      ) : null}
      {AppBskyEmbedImages.isView(imagesEmbed) && (
        <PostEmbeds embed={imagesEmbed} />
      )}
      {AppBskyEmbedRecordWithMedia.isView(imagesEmbed) && (
        <PostEmbeds embed={imagesEmbed.media} />
      )}
    </Link>
  )
}

export default QuoteEmbed

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  quotePost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
})
