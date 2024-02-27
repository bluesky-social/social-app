import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  ModerationUI,
  AppBskyEmbedExternal,
  RichText as RichTextAPI,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {PostMeta} from '../PostMeta'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/shell/composer'
import {PostEmbeds} from '.'
import {PostAlerts} from '../moderation/PostAlerts'
import {makeProfileLink} from 'lib/routes/links'
import {InfoCircleIcon} from 'lib/icons'
import {Trans} from '@lingui/macro'
import {RichText} from '#/components/RichText'
import {atoms as a} from '#/alf'

export function MaybeQuoteEmbed({
  embed,
  moderation,
  style,
}: {
  embed: AppBskyEmbedRecord.View
  moderation: ModerationUI
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  if (
    AppBskyEmbedRecord.isViewRecord(embed.record) &&
    AppBskyFeedPost.isRecord(embed.record.value) &&
    AppBskyFeedPost.validateRecord(embed.record.value).success
  ) {
    return (
      <QuoteEmbed
        quote={{
          author: embed.record.author,
          cid: embed.record.cid,
          uri: embed.record.uri,
          indexedAt: embed.record.indexedAt,
          text: embed.record.value.text,
          facets: embed.record.value.facets,
          embeds: embed.record.embeds,
        }}
        moderation={moderation}
        style={style}
      />
    )
  } else if (AppBskyEmbedRecord.isViewBlocked(embed.record)) {
    return (
      <View style={[styles.errorContainer, pal.borderDark]}>
        <InfoCircleIcon size={18} style={pal.text} />
        <Text type="lg" style={pal.text}>
          <Trans>Blocked</Trans>
        </Text>
      </View>
    )
  } else if (AppBskyEmbedRecord.isViewNotFound(embed.record)) {
    return (
      <View style={[styles.errorContainer, pal.borderDark]}>
        <InfoCircleIcon size={18} style={pal.text} />
        <Text type="lg" style={pal.text}>
          <Trans>Deleted</Trans>
        </Text>
      </View>
    )
  }
  return null
}

export function QuoteEmbed({
  quote,
  moderation,
  style,
}: {
  quote: ComposerOptsQuote
  moderation?: ModerationUI
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey)
  const itemTitle = `Post by ${quote.author.handle}`
  const richText = React.useMemo(
    () =>
      quote.text.trim()
        ? new RichTextAPI({text: quote.text, facets: quote.facets})
        : undefined,
    [quote.text, quote.facets],
  )
  const embed = React.useMemo(() => {
    const e = quote.embeds?.[0]

    if (AppBskyEmbedImages.isView(e) || AppBskyEmbedExternal.isView(e)) {
      return e
    } else if (
      AppBskyEmbedRecordWithMedia.isView(e) &&
      (AppBskyEmbedImages.isView(e.media) ||
        AppBskyEmbedExternal.isView(e.media))
    ) {
      return e.media
    }
  }, [quote.embeds])
  return (
    <Link
      style={[styles.container, pal.borderDark, style]}
      hoverStyle={{borderColor: pal.colors.borderLinkHover}}
      href={itemHref}
      title={itemTitle}>
      <View pointerEvents="none">
        <PostMeta
          author={quote.author}
          showAvatar
          authorHasWarning={false}
          postHref={itemHref}
          timestamp={quote.indexedAt}
        />
      </View>
      {moderation ? (
        <PostAlerts moderation={moderation} style={styles.alert} />
      ) : null}
      {richText ? (
        <RichText
          enableTags
          value={richText}
          style={[a.text_md]}
          numberOfLines={20}
          disableLinks
          authorHandle={quote.author.handle}
        />
      ) : null}
      {embed && <PostEmbeds embed={embed} moderation={{}} />}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  alert: {
    marginBottom: 6,
  },
})
