import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedExternal,
  RichText as RichTextAPI,
  moderatePost,
  ModerationDecision,
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
import {RichText} from 'view/com/util/text/RichText'
import {useModerationOpts} from '#/state/queries/preferences'
import {ContentHider} from '../moderation/ContentHider'

export function MaybeQuoteEmbed({
  embed,
  style,
}: {
  embed: AppBskyEmbedRecord.View
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  if (
    AppBskyEmbedRecord.isViewRecord(embed.record) &&
    AppBskyFeedPost.isRecord(embed.record.value) &&
    AppBskyFeedPost.validateRecord(embed.record.value).success
  ) {
    return (
      <QuoteEmbedModerated
        viewRecord={embed.record}
        postRecord={embed.record.value}
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

function QuoteEmbedModerated({
  viewRecord,
  postRecord,
  style,
}: {
  viewRecord: AppBskyEmbedRecord.ViewRecord
  postRecord: AppBskyFeedPost.Record
  style?: StyleProp<ViewStyle>
}) {
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return moderationOpts
      ? moderatePost(viewRecordToPostView(viewRecord), moderationOpts)
      : undefined
  }, [viewRecord, moderationOpts])

  const quote = {
    author: viewRecord.author,
    cid: viewRecord.cid,
    uri: viewRecord.uri,
    indexedAt: viewRecord.indexedAt,
    text: postRecord.text,
    facets: postRecord.facets,
    embeds: viewRecord.embeds,
  }

  return <QuoteEmbed quote={quote} moderation={moderation} style={style} />
}

export function QuoteEmbed({
  quote,
  moderation,
  style,
}: {
  quote: ComposerOptsQuote
  moderation?: ModerationDecision
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
    <ContentHider modui={moderation?.ui('contentList')}>
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
          <PostAlerts
            modui={moderation.ui('contentView')}
            style={styles.alert}
          />
        ) : null}
        {richText ? (
          <RichText
            richText={richText}
            type="post-text"
            style={pal.text}
            numberOfLines={20}
            noLinks
          />
        ) : null}
        {embed && <PostEmbeds embed={embed} moderation={moderation} />}
      </Link>
    </ContentHider>
  )
}

function viewRecordToPostView(
  viewRecord: AppBskyEmbedRecord.ViewRecord,
): AppBskyFeedDefs.PostView {
  const {value, embeds, ...rest} = viewRecord
  return {
    ...rest,
    $type: 'app.bsky.feed.defs#postView',
    record: value,
    embed: embeds?.[0],
  }
}

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
