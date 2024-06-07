import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  moderatePost,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_20} from '#/lib/constants'
import {s} from '#/lib/styles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePalette} from 'lib/hooks/usePalette'
import {InfoCircleIcon} from 'lib/icons'
import {makeProfileLink} from 'lib/routes/links'
import {precacheProfile} from 'state/queries/profile'
import {ComposerOptsQuote} from 'state/shell/composer'
import {atoms as a} from '#/alf'
import {RichText} from '#/components/RichText'
import {ContentHider} from '../../../../components/moderation/ContentHider'
import {PostAlerts} from '../../../../components/moderation/PostAlerts'
import {Link} from '../Link'
import {PostMeta} from '../PostMeta'
import {Text} from '../text/Text'
import {PostEmbeds} from '.'
import hairlineWidth = StyleSheet.hairlineWidth

export function MaybeQuoteEmbed({
  embed,
  onOpen,
  style,
  allowNestedQuotes,
}: {
  embed: AppBskyEmbedRecord.View
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  allowNestedQuotes?: boolean
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
        onOpen={onOpen}
        style={style}
        allowNestedQuotes={allowNestedQuotes}
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
  onOpen,
  style,
  allowNestedQuotes,
}: {
  viewRecord: AppBskyEmbedRecord.ViewRecord
  postRecord: AppBskyFeedPost.Record
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  allowNestedQuotes?: boolean
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

  return (
    <QuoteEmbed
      quote={quote}
      moderation={moderation}
      onOpen={onOpen}
      style={style}
      allowNestedQuotes={allowNestedQuotes}
    />
  )
}

export function QuoteEmbed({
  quote,
  moderation,
  onOpen,
  style,
  allowNestedQuotes,
}: {
  quote: ComposerOptsQuote
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  allowNestedQuotes?: boolean
}) {
  const queryClient = useQueryClient()
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

    if (allowNestedQuotes) {
      return e
    } else {
      if (AppBskyEmbedImages.isView(e) || AppBskyEmbedExternal.isView(e)) {
        return e
      } else if (
        AppBskyEmbedRecordWithMedia.isView(e) &&
        (AppBskyEmbedImages.isView(e.media) ||
          AppBskyEmbedExternal.isView(e.media))
      ) {
        return e.media
      }
    }
  }, [quote.embeds, allowNestedQuotes])

  const onBeforePress = React.useCallback(() => {
    precacheProfile(queryClient, quote.author)
    onOpen?.()
  }, [queryClient, quote.author, onOpen])

  return (
    <ContentHider
      modui={moderation?.ui('contentList')}
      style={[styles.container, pal.borderDark, style]}
      childContainerStyle={[a.pt_sm]}>
      <Link
        hoverStyle={{borderColor: pal.colors.borderLinkHover}}
        href={itemHref}
        title={itemTitle}
        onBeforePress={onBeforePress}>
        <View pointerEvents="none">
          <PostMeta
            author={quote.author}
            moderation={moderation}
            showAvatar
            authorHasWarning={false}
            postHref={itemHref}
            timestamp={quote.indexedAt}
          />
        </View>
        {moderation ? (
          <PostAlerts modui={moderation.ui('contentView')} style={[a.py_xs]} />
        ) : null}
        {richText ? (
          <RichText
            value={richText}
            style={a.text_md}
            numberOfLines={20}
            disableLinks
          />
        ) : null}
        {embed && <PostEmbeds embed={embed} moderation={moderation} />}
      </Link>
    </ContentHider>
  )
}

export function QuoteX({onRemove}: {onRemove: () => void}) {
  const {_} = useLingui()
  return (
    <TouchableOpacity
      style={[
        a.absolute,
        a.p_xs,
        a.rounded_full,
        a.align_center,
        a.justify_center,
        {
          top: 16,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        },
      ]}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Remove quote`)}
      accessibilityHint={_(msg`Removes quoted post`)}
      onAccessibilityEscape={onRemove}
      hitSlop={HITSLOP_20}>
      <FontAwesomeIcon size={12} icon="xmark" style={s.white} />
    </TouchableOpacity>
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
    borderWidth: hairlineWidth,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: hairlineWidth,
  },
  alert: {
    marginBottom: 6,
  },
})
