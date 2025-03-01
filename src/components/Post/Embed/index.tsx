import React from 'react'
import {
  InteractionManager,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {MeasuredDimensions, runOnJS, runOnUI} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  moderatePost,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {useQueryClient} from '@tanstack/react-query'

import {HandleRef, measureHandle} from '#/lib/hooks/useHandleRef'
import {usePalette} from '#/lib/hooks/usePalette'
import {InfoCircleIcon} from '#/lib/icons'
import {makeProfileLink} from '#/lib/routes/links'
import {useLightboxControls} from '#/state/lightbox'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {Dimensions} from '#/view/com/lightbox/ImageViewing/@types'
import {AutoSizedImage} from '#/view/com/util/images/AutoSizedImage'
import {ImageLayoutGrid} from '#/view/com/util/images/ImageLayoutGrid'
import {Link} from '#/view/com/util/Link'
import {ExternalLinkEmbed} from '#/view/com/util/post-embeds/ExternalLinkEmbed'
import {
  PostEmbedViewContext,
  QuoteEmbedViewContext,
} from '#/view/com/util/post-embeds/types'
import {VideoEmbed} from '#/view/com/util/post-embeds/VideoEmbed'
import {PostMeta} from '#/view/com/util/PostMeta'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import * as ListCard from '#/components/ListCard'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {RichText} from '#/components/RichText'
import {Embed as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import * as bsky from '#/types/bsky'
import {Embed as TEmbed, EmbedType, parseEmbed} from '#/types/bsky/post'

export type CommonProps = {
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  allowNestedQuotes?: boolean
  viewContext?: PostEmbedViewContext
}

export type PostEmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}

export function Embed({embed: rawEmbed, ...rest}: PostEmbedProps) {
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
          <RecordEmbed embed={embed.view} {...rest} />
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
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
          <ImagesEmbed embed={embed} {...rest} />
        </ContentHider>
      )
    }
    case 'link': {
      return (
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
          <ExternalLinkEmbed
            link={embed.view.external}
            onOpen={rest.onOpen}
            style={[a.mt_sm, rest.style]}
          />
        </ContentHider>
      )
    }
    case 'video': {
      return (
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
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
  ...rest
}: CommonProps & {
  embed: TEmbed
}) {
  switch (embed.type) {
    case 'feed': {
      return (
        <View style={a.mt_sm}>
          <ContentHider modui={rest.moderation?.ui('contentList')}>
            <FeedEmbed embed={embed} {...rest} />
          </ContentHider>
        </View>
      )
    }
    case 'list': {
      return (
        <View style={a.mt_sm}>
          <ContentHider modui={rest.moderation?.ui('contentList')}>
            <ListEmbed embed={embed} {...rest} />
          </ContentHider>
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
      return (
        <QuoteEmbed
          {...rest}
          embed={embed}
          viewContext={
            rest.viewContext === PostEmbedViewContext.Feed
              ? QuoteEmbedViewContext.FeedEmbedRecordWithMedia
              : undefined
          }
        />
      )
    }
    case 'post_not_found': {
      return <PostNotFoundEmbed />
    }
    case 'post_blocked': {
      return <PostBlockedEmbed />
    }
    case 'post_detached': {
      return <PostDetachedEmbed embed={embed} />
    }
    default: {
      return null
    }
  }
}

export function ListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  const t = useTheme()
  return (
    <View
      style={[a.border, t.atoms.border_contrast_medium, a.p_md, a.rounded_sm]}>
      <ListCard.Default view={embed.view} />
    </View>
  )
}

export function FeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  const pal = usePalette('default')
  return (
    <FeedSourceCard
      feedUri={embed.view.uri}
      style={[pal.view, pal.border, styles.customFeedOuter]}
      showLikes
    />
  )
}

export function ImagesEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'>
}) {
  const {openLightbox} = useLightboxControls()
  const {images} = embed.view

  if (images.length > 0) {
    const items = images.map(img => ({
      uri: img.fullsize,
      thumbUri: img.thumb,
      alt: img.alt,
      dimensions: img.aspectRatio ?? null,
    }))
    const _openLightbox = (
      index: number,
      thumbRects: (MeasuredDimensions | null)[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      openLightbox({
        images: items.map((item, i) => ({
          ...item,
          thumbRect: thumbRects[i] ?? null,
          thumbDimensions: fetchedDims[i] ?? null,
          type: 'image',
        })),
        index,
      })
    }
    const onPress = (
      index: number,
      refs: HandleRef[],
      fetchedDims: (Dimensions | null)[],
    ) => {
      const handles = refs.map(r => r.current)
      runOnUI(() => {
        'worklet'
        const rects = handles.map(measureHandle)
        runOnJS(_openLightbox)(index, rects, fetchedDims)
      })()
    }
    const onPressIn = (_: number) => {
      InteractionManager.runAfterInteractions(() => {
        Image.prefetch(items.map(i => i.uri))
      })
    }

    if (images.length === 1) {
      const image = images[0]
      return (
        <View style={[a.mt_sm, rest.style]}>
          <AutoSizedImage
            crop={
              rest.viewContext === PostEmbedViewContext.ThreadHighlighted
                ? 'none'
                : rest.viewContext ===
                  PostEmbedViewContext.FeedEmbedRecordWithMedia
                ? 'square'
                : 'constrained'
            }
            image={image}
            onPress={(containerRef, dims) => onPress(0, [containerRef], [dims])}
            onPressIn={() => onPressIn(0)}
            hideBadge={
              rest.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
            }
          />
        </View>
      )
    }

    return (
      <View style={[a.mt_sm, rest.style]}>
        <ImageLayoutGrid
          images={images}
          onPress={onPress}
          onPressIn={onPressIn}
          viewContext={rest.viewContext}
        />
      </View>
    )
  }
}

export function PostBlockedEmbed() {
  const t = useTheme()
  const pal = usePalette('default')
  return (
    <View
      style={[styles.errorContainer, a.border, t.atoms.border_contrast_low]}>
      <InfoCircleIcon size={18} style={pal.text} />
      <Text type="lg" style={pal.text}>
        <Trans>Blocked</Trans>
      </Text>
    </View>
  )
}

export function PostNotFoundEmbed() {
  const t = useTheme()
  const pal = usePalette('default')
  return (
    <View
      style={[styles.errorContainer, a.border, t.atoms.border_contrast_low]}>
      <InfoCircleIcon size={18} style={pal.text} />
      <Text type="lg" style={pal.text}>
        <Trans>Deleted</Trans>
      </Text>
    </View>
  )
}

export function PostDetachedEmbed({
  embed,
}: {
  embed: EmbedType<'post_detached'>
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {currentAccount} = useSession()
  const isViewerOwner = currentAccount?.did
    ? embed.view.uri.includes(currentAccount.did)
    : false
  return (
    <View
      style={[styles.errorContainer, a.border, t.atoms.border_contrast_low]}>
      <InfoCircleIcon size={18} style={pal.text} />
      <Text type="lg" style={pal.text}>
        {isViewerOwner ? (
          <Trans>Removed by you</Trans>
        ) : (
          <Trans>Removed by author</Trans>
        )}
      </Text>
    </View>
  )
}

function QuoteEmbed({
  embed,
  onOpen,
  style,
}: Omit<CommonProps, 'viewContext'> & {
  embed: EmbedType<'post'>
  viewContext?: QuoteEmbedViewContext
}) {
  const moderationOpts = useModerationOpts()
  const quote = React.useMemo<$Typed<AppBskyFeedDefs.PostView>>(
    () => ({
      ...embed.view,
      $type: 'app.bsky.feed.defs#postView',
      record: embed.view.value,
      embed: embed.view.embeds?.[0],
    }),
    [embed],
  )
  const moderation = React.useMemo(() => {
    return moderationOpts ? moderatePost(quote, moderationOpts) : undefined
  }, [quote, moderationOpts])

  const t = useTheme()
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey)
  const itemTitle = `Post by ${quote.author.handle}`

  const richText = React.useMemo(() => {
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

  const onBeforePress = React.useCallback(() => {
    unstableCacheProfileView(queryClient, quote.author)
    onOpen?.()
  }, [queryClient, quote.author, onOpen])

  const [hover, setHover] = React.useState(false)
  return (
    <View
      onPointerEnter={() => {
        setHover(true)
      }}
      onPointerLeave={() => {
        setHover(false)
      }}>
      <ContentHider
        modui={moderation?.ui('contentList')}
        style={[
          a.rounded_md,
          a.p_md,
          a.mt_sm,
          a.border,
          t.atoms.border_contrast_low,
          style,
        ]}
        childContainerStyle={[a.pt_sm]}>
        <SubtleWebHover hover={hover} />
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
          {quote.embed && <Embed embed={quote.embed} moderation={moderation} />}
        </Link>
      </ContentHider>
    </View>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 6,
    bottom: 6,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: '600',
  },
  customFeedOuter: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
