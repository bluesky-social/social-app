import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {
  type $Typed,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  moderatePost,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {Link} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {atoms as a, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {RichText} from '#/components/RichText'
import {Embed as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'
import {
  type Embed as TEmbed,
  type EmbedType,
  parseEmbed,
} from '#/types/bsky/post'
import {ExternalEmbed} from './ExternalEmbed'
import {ModeratedFeedEmbed} from './FeedEmbed'
import {ImageEmbed} from './ImageEmbed'
import {ModeratedListEmbed} from './ListEmbed'
import {PostPlaceholder as PostPlaceholderText} from './PostPlaceholder'
import {
  type CommonProps,
  type EmbedProps,
  PostEmbedViewContext,
  QuoteEmbedViewContext,
} from './types'
import {VideoEmbed} from './VideoEmbed'

export {PostEmbedViewContext, QuoteEmbedViewContext} from './types'
export {embedHasMedia} from './util'

import {embedHasMedia} from './util'

type CompactMediaInfo = {
  type: 'image' | 'video' | 'gif'
  thumbnails: Array<{uri: string; alt?: string}>
}

/**
 * Extract compact media info from an embed for thumbnail display
 */
function extractCompactMedia(embed: TEmbed | null): CompactMediaInfo | null {
  if (!embed) return null

  switch (embed.type) {
    case 'images': {
      const images = embed.view.images
      if (!images.length) return null
      return {
        type: 'image',
        thumbnails: images
          .slice(0, 4)
          .map(img => ({uri: img.thumb, alt: img.alt})),
      }
    }
    case 'video': {
      if (!embed.view.thumbnail) return null
      return {
        type: 'video',
        thumbnails: [{uri: embed.view.thumbnail, alt: embed.view.alt}],
      }
    }
    case 'link': {
      const player = parseEmbedPlayerFromUrl(embed.view.external.uri)
      if (player?.isGif && embed.view.external.thumb) {
        return {
          type: 'gif',
          thumbnails: [
            {uri: embed.view.external.thumb, alt: embed.view.external.title},
          ],
        }
      }
      return null
    }
    case 'post_with_media':
      return extractCompactMedia(embed.media)
    default:
      return null
  }
}

/**
 * Renders compact media thumbnails in a grid layout
 * - 1 image: full size
 * - 2 images: side by side
 * - 3 images: 1st on left half, 2nd and 3rd stacked on right half
 * - 4 images: 2x2 grid
 */
function CompactMediaThumbnails({
  media,
  accessibilityHint,
}: {
  media: CompactMediaInfo
  accessibilityHint: string
}) {
  const {thumbnails} = media
  const count = thumbnails.length
  const gap = 2

  if (count === 1) {
    return (
      <Image
        source={{uri: thumbnails[0].uri}}
        style={[a.w_full, a.h_full]}
        contentFit="cover"
        accessibilityLabel={thumbnails[0].alt || ''}
        accessibilityHint={accessibilityHint}
      />
    )
  }

  if (count === 2) {
    return (
      <View style={[a.flex_row, a.w_full, a.h_full]}>
        <Image
          source={{uri: thumbnails[0].uri}}
          style={[{width: '50%'}, a.h_full, {marginRight: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[0].alt || ''}
          accessibilityHint={accessibilityHint}
        />
        <Image
          source={{uri: thumbnails[1].uri}}
          style={[{width: '50%'}, a.h_full, {marginLeft: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[1].alt || ''}
          accessibilityHint={accessibilityHint}
        />
      </View>
    )
  }

  if (count === 3) {
    return (
      <View style={[a.flex_row, a.w_full, a.h_full]}>
        <Image
          source={{uri: thumbnails[0].uri}}
          style={[{width: '50%'}, a.h_full, {marginRight: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[0].alt || ''}
          accessibilityHint={accessibilityHint}
        />
        <View style={[{width: '50%'}, a.h_full, {marginLeft: gap / 2}]}>
          <Image
            source={{uri: thumbnails[1].uri}}
            style={[a.w_full, {height: '50%'}, {marginBottom: gap / 2}]}
            contentFit="cover"
            accessibilityLabel={thumbnails[1].alt || ''}
            accessibilityHint={accessibilityHint}
          />
          <Image
            source={{uri: thumbnails[2].uri}}
            style={[a.w_full, {height: '50%'}, {marginTop: gap / 2}]}
            contentFit="cover"
            accessibilityLabel={thumbnails[2].alt || ''}
            accessibilityHint={accessibilityHint}
          />
        </View>
      </View>
    )
  }

  // 4 images: 2x2 grid
  return (
    <View style={[a.w_full, a.h_full]}>
      <View style={[a.flex_row, {height: '50%'}, {marginBottom: gap / 2}]}>
        <Image
          source={{uri: thumbnails[0].uri}}
          style={[{width: '50%'}, a.h_full, {marginRight: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[0].alt || ''}
          accessibilityHint={accessibilityHint}
        />
        <Image
          source={{uri: thumbnails[1].uri}}
          style={[{width: '50%'}, a.h_full, {marginLeft: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[1].alt || ''}
          accessibilityHint={accessibilityHint}
        />
      </View>
      <View style={[a.flex_row, {height: '50%'}, {marginTop: gap / 2}]}>
        <Image
          source={{uri: thumbnails[2].uri}}
          style={[{width: '50%'}, a.h_full, {marginRight: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[2].alt || ''}
          accessibilityHint={accessibilityHint}
        />
        <Image
          source={{uri: thumbnails[3].uri}}
          style={[{width: '50%'}, a.h_full, {marginLeft: gap / 2}]}
          contentFit="cover"
          accessibilityLabel={thumbnails[3].alt || ''}
          accessibilityHint={accessibilityHint}
        />
      </View>
    </View>
  )
}

export function Embed({embed: rawEmbed, ...rest}: EmbedProps) {
  const embed = parseEmbed(rawEmbed)

  switch (embed.type) {
    case 'images':
    case 'link':
    case 'video': {
      return <MediaEmbed embed={embed} {...rest} />
    }
    case 'feed':
    case 'list':
    case 'starter_pack':
    case 'labeler':
    case 'post':
    case 'post_not_found':
    case 'post_blocked':
    case 'post_detached': {
      return <RecordEmbed embed={embed} {...rest} />
    }
    case 'post_with_media': {
      return (
        <View style={rest.style}>
          <MediaEmbed embed={embed.media} {...rest} />
          <RecordEmbed embed={embed.view} {...rest} parentHasMedia />
        </View>
      )
    }
    default: {
      return null
    }
  }
}

function MediaEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: TEmbed
}) {
  switch (embed.type) {
    case 'images': {
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <ImageEmbed embed={embed} {...rest} />
        </ContentHider>
      )
    }
    case 'link': {
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <ExternalEmbed
            link={embed.view.external}
            onOpen={rest.onOpen}
            style={[a.mt_sm, rest.style]}
          />
        </ContentHider>
      )
    }
    case 'video': {
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <VideoEmbed embed={embed.view} />
        </ContentHider>
      )
    }
    default: {
      return null
    }
  }
}

function RecordEmbed({
  embed,
  parentHasMedia,
  ...rest
}: CommonProps & {
  embed: TEmbed
  parentHasMedia?: boolean
}) {
  switch (embed.type) {
    case 'feed': {
      return (
        <View style={a.mt_sm}>
          <ModeratedFeedEmbed embed={embed} {...rest} />
        </View>
      )
    }
    case 'list': {
      return (
        <View style={a.mt_sm}>
          <ModeratedListEmbed embed={embed} />
        </View>
      )
    }
    case 'starter_pack': {
      return (
        <View style={a.mt_sm}>
          <StarterPackCard starterPack={embed.view} />
        </View>
      )
    }
    case 'labeler': {
      // not implemented
      return null
    }
    case 'post': {
      if (rest.isWithinQuote && !rest.allowNestedQuotes) {
        return null
      }

      // Determine the view context for the quote embed
      // Use compact layout when: parent has media AND quoted post has media AND we're in feed view
      const quotedPostEmbed = embed.view.embeds?.[0]
        ? parseEmbed(embed.view.embeds[0])
        : undefined
      const quotedPostHasMedia = embedHasMedia(quotedPostEmbed)
      const shouldUseCompact =
        parentHasMedia &&
        quotedPostHasMedia &&
        rest.viewContext === PostEmbedViewContext.Feed

      return (
        <QuoteEmbed
          {...rest}
          embed={embed}
          viewContext={
            shouldUseCompact
              ? QuoteEmbedViewContext.CompactWithMedia
              : rest.viewContext === PostEmbedViewContext.Feed
                ? QuoteEmbedViewContext.FeedEmbedRecordWithMedia
                : undefined
          }
          isWithinQuote={rest.isWithinQuote}
          allowNestedQuotes={rest.allowNestedQuotes}
        />
      )
    }
    case 'post_not_found': {
      return (
        <PostPlaceholderText>
          <Trans>Deleted</Trans>
        </PostPlaceholderText>
      )
    }
    case 'post_blocked': {
      return (
        <PostPlaceholderText>
          <Trans>Blocked</Trans>
        </PostPlaceholderText>
      )
    }
    case 'post_detached': {
      return <PostDetachedEmbed embed={embed} />
    }
    default: {
      return null
    }
  }
}

export function PostDetachedEmbed({
  embed,
}: {
  embed: EmbedType<'post_detached'>
}) {
  const {currentAccount} = useSession()
  const isViewerOwner = currentAccount?.did
    ? embed.view.uri.includes(currentAccount.did)
    : false

  return (
    <PostPlaceholderText>
      {isViewerOwner ? (
        <Trans>Removed by you</Trans>
      ) : (
        <Trans>Removed by author</Trans>
      )}
    </PostPlaceholderText>
  )
}

/*
 * Nests parent `Embed` component and therefore must live in this file to avoid
 * circular imports.
 */
export function QuoteEmbed({
  embed,
  onOpen,
  style,
  viewContext,
  isWithinQuote: parentIsWithinQuote,
  allowNestedQuotes: parentAllowNestedQuotes,
}: Omit<CommonProps, 'viewContext'> & {
  embed: EmbedType<'post'>
  viewContext?: QuoteEmbedViewContext
}) {
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const quote = useMemo<$Typed<AppBskyFeedDefs.PostView>>(
    () => ({
      ...embed.view,
      $type: 'app.bsky.feed.defs#postView',
      record: embed.view.value,
      embed: embed.view.embeds?.[0],
    }),
    [embed],
  )
  const moderation = useMemo(() => {
    return moderationOpts ? moderatePost(quote, moderationOpts) : undefined
  }, [quote, moderationOpts])

  const t = useTheme()
  const queryClient = useQueryClient()
  const itemUrip = new AtUri(quote.uri)
  const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey)
  const itemTitle = `Post by ${quote.author.handle}`

  const richText = useMemo(() => {
    if (
      !bsky.dangerousIsType<AppBskyFeedPost.Record>(
        quote.record,
        AppBskyFeedPost.isRecord,
      )
    )
      return undefined
    const {text, facets} = quote.record
    return text.trim()
      ? new RichTextAPI({text: text, facets: facets})
      : undefined
  }, [quote.record])

  const onBeforePress = useCallback(() => {
    unstableCacheProfileView(queryClient, quote.author)
    onOpen?.()
  }, [queryClient, quote.author, onOpen])

  const {
    state: hover,
    onIn: onPointerEnter,
    onOut: onPointerLeave,
  } = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  // Extract compact media info if we're in compact mode
  const parsedEmbed = quote.embed ? parseEmbed(quote.embed) : null
  const compactMedia =
    viewContext === QuoteEmbedViewContext.CompactWithMedia
      ? extractCompactMedia(parsedEmbed)
      : null

  // Use compact layout when in compact mode and we have media to show
  if (viewContext === QuoteEmbedViewContext.CompactWithMedia && compactMedia) {
    return (
      <View
        style={[a.mt_sm]}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}>
        <ContentHider
          modui={moderation?.ui('contentList')}
          style={[a.rounded_md, a.border, t.atoms.border_contrast_low, style]}
          activeStyle={[a.p_md, a.pt_sm]}
          childContainerStyle={[a.pt_sm]}>
          {({active}) => (
            <>
              {!active && (
                <SubtleHover
                  native
                  hover={hover || pressed}
                  style={[a.rounded_md]}
                />
              )}
              <Link
                style={[!active && a.p_md]}
                hoverStyle={t.atoms.border_contrast_high}
                href={itemHref}
                title={itemTitle}
                onBeforePress={onBeforePress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}>
                <View pointerEvents="none">
                  {/* User info on top like normal */}
                  <PostMeta
                    author={quote.author}
                    moderation={moderation}
                    showAvatar
                    postHref={itemHref}
                    timestamp={quote.indexedAt}
                  />
                  {moderation ? (
                    <PostAlerts
                      modui={moderation.ui('contentView')}
                      style={[a.py_xs]}
                    />
                  ) : null}
                  {/* Thumbnail and text side by side */}
                  <View style={[a.flex_row, a.gap_md, a.mt_xs]}>
                    {/* Thumbnail(s) on the left */}
                    <View
                      style={[
                        a.rounded_sm,
                        a.overflow_hidden,
                        {width: 98, height: 98},
                      ]}>
                      <CompactMediaThumbnails
                        media={compactMedia}
                        accessibilityHint={_(
                          msg`Thumbnail of quoted post media`,
                        )}
                      />
                      <MediaInsetBorder style={[a.rounded_sm]} />
                      {/* Video or GIF label overlay */}
                      {compactMedia.type === 'video' && (
                        <View
                          style={[
                            a.absolute,
                            {
                              left: 4,
                              bottom: 4,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: 4,
                              paddingHorizontal: 4,
                              paddingVertical: 2,
                            },
                          ]}>
                          <Text
                            style={[
                              {color: t.palette.white, fontSize: 9},
                              a.font_bold,
                            ]}>
                            ▶
                          </Text>
                        </View>
                      )}
                      {compactMedia.type === 'gif' && (
                        <View
                          style={[
                            a.absolute,
                            {
                              left: 4,
                              bottom: 4,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: 4,
                              paddingHorizontal: 4,
                              paddingVertical: 2,
                            },
                          ]}>
                          <Text
                            style={[
                              {color: t.palette.white, fontSize: 9},
                              a.font_bold,
                            ]}>
                            GIF
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Text content on the right */}
                    <View style={[a.flex_1, {maxHeight: 98}]}>
                      {richText ? (
                        <RichText
                          value={richText}
                          style={a.text_md}
                          numberOfLines={4}
                          disableLinks
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </Link>
            </>
          )}
        </ContentHider>
      </View>
    )
  }

  // Normal vertical layout
  return (
    <View
      style={[a.mt_sm]}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}>
      <ContentHider
        modui={moderation?.ui('contentList')}
        style={[a.rounded_md, a.border, t.atoms.border_contrast_low, style]}
        activeStyle={[a.p_md, a.pt_sm]}
        childContainerStyle={[a.pt_sm]}>
        {({active}) => (
          <>
            {!active && (
              <SubtleHover
                native
                hover={hover || pressed}
                style={[a.rounded_md]}
              />
            )}
            <Link
              style={[!active && a.p_md]}
              hoverStyle={t.atoms.border_contrast_high}
              href={itemHref}
              title={itemTitle}
              onBeforePress={onBeforePress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}>
              <View pointerEvents="none">
                <PostMeta
                  author={quote.author}
                  moderation={moderation}
                  showAvatar
                  postHref={itemHref}
                  timestamp={quote.indexedAt}
                />
              </View>
              {moderation ? (
                <PostAlerts
                  modui={moderation.ui('contentView')}
                  style={[a.py_xs]}
                />
              ) : null}
              {richText ? (
                <RichText
                  value={richText}
                  style={a.text_md}
                  numberOfLines={20}
                  disableLinks
                />
              ) : null}
              {quote.embed && (
                <Embed
                  embed={quote.embed}
                  moderation={moderation}
                  isWithinQuote={parentIsWithinQuote ?? true}
                  // already within quote? override nested
                  allowNestedQuotes={
                    parentIsWithinQuote ? false : parentAllowNestedQuotes
                  }
                />
              )}
            </Link>
          </>
        )}
      </ContentHider>
    </View>
  )
}
