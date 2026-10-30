import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {type $Typed} from '@atproto/lex'
import {AtUri} from '@atproto/syntax'
import {
  mergeModUIResults,
  moderatePost,
  moderateViewExternal,
} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {getEmbedCreator} from '#/lib/at-card'
import {makeProfileLink} from '#/lib/routes/links'
import {getChatInviteCodeFromUrl} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {Link} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {
  POST_NUMBER_INLINE_OFFSET,
  ThreadItemPostNumber,
  useHasThreadItemPostNumber,
} from '#/screens/PostThread/components/ThreadItemPostNumber'
import {atoms as a, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {GalleryBleed} from '#/components/images/Gallery'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import * as ReportDialogMetadataContext from '#/components/moderation/ReportDialog/ReportDialogMetadataContext'
import {AtCard} from '#/components/Post/Embed/AtCard'
import {getAtCardProvider} from '#/components/Post/Embed/AtCard/providers'
import {StandardSiteEmbed} from '#/components/Post/Embed/StandardSiteEmbed'
import {isStandardSiteEmbed} from '#/components/Post/Embed/StandardSiteEmbed/utils'
import {RichText} from '#/components/RichText'
import {Embed as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleHover} from '#/components/SubtleHover'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  type Embed as TEmbed,
  type EmbedType,
  parseEmbed,
} from '#/types/bsky/post'
import {ChatInviteEmbed} from './ChatInviteEmbed'
import {CompactMedia, getEmbedThumbnails} from './CompactMedia'
import {ExternalEmbed} from './ExternalEmbed'
import {ModeratedFeedEmbed} from './FeedEmbed'
import {ImageEmbed} from './ImageEmbed'
import {ModeratedListEmbed} from './ListEmbed'
import {PostPlaceholder as PostPlaceholderText} from './PostPlaceholder'
import {type CommonProps, type EmbedProps, PostEmbedViewContext} from './types'
import {VideoEmbed} from './VideoEmbed'

export {PostEmbedViewContext} from './types'

export function Embed({embed: rawEmbed, ...rest}: EmbedProps) {
  const embed = parseEmbed(rawEmbed)

  switch (embed.type) {
    case 'images':
    case 'gallery':
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
        <View
          style={[
            rest.style,
            rest.viewContext === PostEmbedViewContext.ChatMessage && a.gap_sm,
          ]}>
          <MediaEmbed embed={embed.media} {...rest} />
          <RecordEmbed
            embed={embed.view}
            {...rest}
            // The post's own media comes first, so its quote steps back
            quotePresentation={rest.quotePresentation ?? 'compact'}
          />
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
  presentation = 'default',
  ...rest
}: CommonProps & {
  embed: TEmbed
  /**
   * `compact` shows links as compact cards, for a compact quote. Images and
   * video aren't compacted here, since a compact quote puts them beside its
   * text.
   */
  presentation?: 'default' | 'compact'
}) {
  switch (embed.type) {
    case 'images':
    case 'gallery': {
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <ImageEmbed embed={embed} {...rest} />
        </ContentHider>
      )
    }
    case 'link': {
      const atProvider = getAtCardProvider(embed.view.external.uri)
      if (atProvider || isStandardSiteEmbed(embed.view.external)) {
        return (
          <ExternalCardEmbed
            embed={embed}
            Card={atProvider ? AtCard : StandardSiteEmbed}
            presentation={presentation}
            {...rest}
          />
        )
      }
      const chatInviteCode = getChatInviteCodeFromUrl(embed.view.external.uri)
      if (chatInviteCode && presentation === 'default') {
        return (
          <ContentHider
            modui={rest.moderation?.ui('contentMedia')}
            activeStyle={[a.mt_sm]}>
            <ChatInviteEmbed
              code={chatInviteCode}
              link={embed.view.external}
              onOpen={rest.onOpen}
              style={rest.style}
            />
          </ContentHider>
        )
      }
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <ExternalEmbed
            link={embed.view.external}
            onOpen={rest.onOpen}
            post={rest.post}
            style={[a.mt_sm, rest.style]}
            presentation={presentation}
            borderColor={rest.borderColor}
          />
        </ContentHider>
      )
    }
    case 'video': {
      return (
        <ContentHider
          modui={rest.moderation?.ui('contentMedia')}
          activeStyle={[a.mt_sm]}>
          <VideoEmbed embed={embed.view} post={rest.post} />
        </ContentHider>
      )
    }
    default: {
      return null
    }
  }
}

/*
 * Renders rich external cards (AtCard, StandardSiteEmbed), respecting any
 * moderation labels attached to the `viewExternal` itself. The SDK's
 * `moderatePost` only covers post-level labels, so the external view's labels
 * produce their own decision, merged into the card's `ContentHider` alongside
 * the post-level media moderation.
 */
function ExternalCardEmbed({
  embed,
  Card,
  presentation,
  ...rest
}: CommonProps & {
  embed: EmbedType<'link'>
  Card: typeof AtCard | typeof StandardSiteEmbed
  /**
   * `compact` swaps the rich card for a compact link card.
   */
  presentation: 'default' | 'compact'
}) {
  const postModerationDecision = rest.moderation
  const moderationOpts = useModerationOpts()
  const external = embed.view.external

  /*
   * The card is both the "content" and the "media" of the embed, so merge
   * the two contexts: label defs with `blurs: content` act on `contentView`,
   * while defs with `blurs: media` act on `contentMedia`.
   */
  const moduis = [postModerationDecision?.ui('contentMedia')]
  if (moderationOpts && external.labels?.length) {
    const decision = moderateViewExternal(external, moderationOpts)
    moduis.push(decision.ui('contentView'), decision.ui('contentMedia'))
  }

  return (
    <ContentHider modui={mergeModUIResults(...moduis)} activeStyle={[a.mt_sm]}>
      {presentation === 'compact' ? (
        <ExternalEmbed
          link={external}
          onOpen={rest.onOpen}
          post={rest.post}
          style={[a.mt_sm, rest.style]}
          presentation="compact"
          borderColor={rest.borderColor}
        />
      ) : (
        <Card
          view={external}
          authorDid={getEmbedCreator(rest.post?.record, external.uri)}
          onEmbedInteractionCallback={rest.onOpen}
          style={[a.mt_sm, rest.style]}
        />
      )}
    </ContentHider>
  )
}

/**
 * A record embed on its own, from `parseEmbed` or `parseEmbedRecordView`:
 * a quoted post or its placeholder, a feed, a list or a starter pack.
 */
export function RecordEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: TEmbed
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
          <ModeratedListEmbed embed={embed} borderColor={rest.borderColor} />
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

      return (
        <QuoteEmbed
          {...rest}
          embed={embed}
          viewContext={rest.viewContext}
          isWithinQuote={rest.isWithinQuote}
          allowNestedQuotes={rest.allowNestedQuotes}
        />
      )
    }
    case 'post_not_found': {
      return (
        <PostPlaceholderText borderColor={rest.borderColor}>
          <Trans>Deleted</Trans>
        </PostPlaceholderText>
      )
    }
    case 'post_blocked': {
      return (
        <PostPlaceholderText borderColor={rest.borderColor}>
          <Trans>Blocked</Trans>
        </PostPlaceholderText>
      )
    }
    case 'post_detached': {
      return <PostDetachedEmbed embed={embed} borderColor={rest.borderColor} />
    }
    default: {
      return null
    }
  }
}

export function PostDetachedEmbed({
  embed,
  borderColor,
}: {
  embed: EmbedType<'post_detached'>
  borderColor?: string
}) {
  const {currentAccount} = useSession()
  const isViewerOwner = currentAccount?.did
    ? embed.view.uri.includes(currentAccount.did)
    : false

  return (
    <PostPlaceholderText borderColor={borderColor}>
      {isViewerOwner ? (
        <Trans>Removed by you</Trans>
      ) : (
        <Trans>Removed by author</Trans>
      )}
    </PostPlaceholderText>
  )
}

/**
 * Lines of text in a compact quote, about as tall as its media square.
 */
const COMPACT_QUOTE_LINES = 6

/*
 * Nests parent `Embed` component and therefore must live in this file to avoid
 * circular imports.
 */
export function QuoteEmbed({
  embed,
  onOpen,
  style,
  linkDisabled,
  isWithinQuote: parentIsWithinQuote,
  allowNestedQuotes: parentAllowNestedQuotes,
  viewContext,
  quotePresentation = 'default',
  isQuoteTextMuted = false,
  borderColor,
}: Omit<CommonProps, 'viewContext'> & {
  embed: EmbedType<'post'>
  viewContext?: PostEmbedViewContext
  linkDisabled?: boolean
}) {
  const moderationOpts = useModerationOpts()
  const quote = useMemo<$Typed<app.bsky.feed.defs.PostView>>(
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
  const postNumbering = embed.view
  const showPostNumber = useHasThreadItemPostNumber(embed.view)

  const richText = useMemo(() => {
    if (!bsky.isType(app.bsky.feed.post, quote.record)) return undefined
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

  const text = richText?.text ? (
    <RichText
      value={richText}
      style={[a.text_md, isQuoteTextMuted && t.atoms.text_contrast_medium]}
      numberOfLines={quotePresentation === 'compact' ? COMPACT_QUOTE_LINES : 20}
      disableLinks
      suffixOffset={POST_NUMBER_INLINE_OFFSET}
      suffix={
        showPostNumber ? (
          <ThreadItemPostNumber value={postNumbering} />
        ) : undefined
      }
    />
  ) : (
    <ThreadItemPostNumber inline={false} value={postNumbering} />
  )

  const contents = (
    <ReportDialogMetadataContext.Provider key={quote.uri}>
      <PostMeta
        author={quote.author}
        moderation={moderation}
        showAvatar
        postHref={itemHref}
        timestamp={quote.indexedAt}
        linkDisabled
      />
      {moderation ? (
        <PostAlerts
          post={quote}
          modui={moderation.ui('contentView')}
          style={[a.py_xs]}
        />
      ) : null}
      {quotePresentation === 'compact' ? (
        <CompactQuoteBody
          quote={quote}
          moderation={moderation}
          viewContext={viewContext}
          isWithinQuote={parentIsWithinQuote ?? true}
          allowNestedQuotes={
            parentIsWithinQuote ? false : parentAllowNestedQuotes
          }
          borderColor={borderColor}>
          {text}
        </CompactQuoteBody>
      ) : (
        <>
          {text}
          {quote.embed && (
            <Embed
              embed={quote.embed}
              moderation={moderation}
              viewContext={viewContext}
              isWithinQuote={parentIsWithinQuote ?? true}
              // already within quote? override nested
              allowNestedQuotes={
                parentIsWithinQuote ? false : parentAllowNestedQuotes
              }
              // The photo embed belongs to the quoted post, so attribute its
              // analytics to the quoted post rather than the parent.
              post={quote}
              borderColor={borderColor}
            />
          )}
        </>
      )}
    </ReportDialogMetadataContext.Provider>
  )

  return (
    <GalleryBleed>
      <View
        style={[viewContext !== PostEmbedViewContext.ChatMessage && a.mt_sm]}
        onPointerEnter={linkDisabled ? undefined : onPointerEnter}
        onPointerLeave={linkDisabled ? undefined : onPointerLeave}>
        <ContentHider
          modui={moderation?.ui('contentList')}
          style={[
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
            borderColor !== undefined && {borderColor},
            style,
          ]}
          activeStyle={[a.p_md, a.pt_sm]}
          childContainerStyle={[a.pt_sm]}>
          {({active}) => (
            <>
              {!active && !linkDisabled && (
                <SubtleHover
                  native
                  hover={hover || pressed}
                  style={[a.rounded_md]}
                />
              )}
              {linkDisabled ? (
                <View style={[!active && a.p_md]} pointerEvents="none">
                  {contents}
                </View>
              ) : (
                <Link
                  style={[!active && a.p_md]}
                  hoverStyle={t.atoms.border_contrast_high}
                  href={itemHref}
                  title={itemTitle}
                  onBeforePress={onBeforePress}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}>
                  {contents}
                </Link>
              )}
            </>
          )}
        </ContentHider>
      </View>
    </GalleryBleed>
  )
}

/**
 * Everything in a compact quote below its header: the quoted post's images,
 * video or GIF as a square beside its text, then a compact card for its
 * link, then any record it embeds in turn, as a full quote would show it.
 */
function CompactQuoteBody({
  quote,
  moderation,
  viewContext,
  isWithinQuote,
  allowNestedQuotes,
  borderColor,
  children,
}: Pick<
  CommonProps,
  | 'moderation'
  | 'viewContext'
  | 'isWithinQuote'
  | 'allowNestedQuotes'
  | 'borderColor'
> & {
  quote: app.bsky.feed.defs.PostView
  /**
   * The quoted post's text.
   */
  children: React.ReactNode
}) {
  const embed = parseEmbed(quote.embed)
  const media = embed.type === 'post_with_media' ? embed.media : embed
  const record = embed.type === 'post_with_media' ? embed.view : embed
  const hasThumbnails = getEmbedThumbnails(quote.embed).length > 0
  const mediaModui = moderation?.ui('contentMedia')
  /*
   * A media warning doesn't fit in the square, so hidden media moves under
   * the text, behind the usual warning, and appears there once revealed.
   */
  const isMediaHidden = Boolean(mediaModui?.blurs[0])
  const square = hasThumbnails && (
    <CompactMedia embed={quote.embed} size={120} />
  )

  return (
    <>
      <View style={[a.flex_row, a.gap_sm]}>
        {!isMediaHidden && square}
        <View style={[a.flex_1]}>{children}</View>
      </View>
      {isMediaHidden && square && (
        <ContentHider
          modui={mediaModui}
          activeStyle={[a.mt_sm]}
          childContainerStyle={[a.pt_sm]}>
          {square}
        </ContentHider>
      )}
      {!hasThumbnails && media.type === 'link' && (
        <MediaEmbed
          embed={media}
          presentation="compact"
          moderation={moderation}
          viewContext={viewContext}
          post={quote}
          borderColor={borderColor}
        />
      )}
      <RecordEmbed
        embed={record}
        moderation={moderation}
        viewContext={viewContext}
        isWithinQuote={isWithinQuote}
        allowNestedQuotes={allowNestedQuotes}
        post={quote}
        borderColor={borderColor}
      />
    </>
  )
}
