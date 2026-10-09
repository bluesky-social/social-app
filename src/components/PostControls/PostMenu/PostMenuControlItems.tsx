import {AtUri} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {type Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {usePostRepostMutationQueue} from '#/state/queries/post'
import {useRequireAuth} from '#/state/session'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilledIcon,
  Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon,
} from '#/components/icons/Bookmark'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {type app} from '#/lexicons'
import {usePostBookmark} from '../BookmarkButton'

/**
 * Repost, quote, share and save as a group of menu items, for surfaces that
 * don't render the full `PostControls`, e.g. notification rows. Each one does
 * what the matching control does, including its metrics and feed feedback.
 */
export function PostMenuControlItems({
  post,
  postFeedContext,
  postReqId,
  logContext,
}: {
  post: Shadow<app.bsky.feed.defs.PostView>
  postFeedContext: string | undefined
  postReqId: string | undefined
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const haptics = useHaptics()
  const requireAuth = useRequireAuth()
  const {openComposer} = useOpenComposer()
  const {feedDescriptor, sendInteraction} = useFeedFeedbackContext()
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    post,
    undefined,
    feedDescriptor,
    logContext,
  )
  const {isBookmarked, toggleBookmark} = usePostBookmark({post, logContext})

  const isReposted = Boolean(post.viewer?.repost)
  const embeddingDisabled = Boolean(post.viewer?.embeddingDisabled)
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
    post.author.viewer?.blockedBy ||
    post.author.viewer?.blockingByList,
  )

  const showBlockedToast = () => {
    Toast.show(l`Cannot interact with a blocked user`, {type: 'warning'})
  }

  const onRepost = async () => {
    if (isBlocked) {
      showBlockedToast()
      return
    }
    /*
     * Unlike the repost button, the menu has closed by the time this lands,
     * so a toast confirms it.
     */
    try {
      if (isReposted) {
        await queueUnrepost()
        Toast.show(
          l({
            message: 'Repost removed',
            context: 'Toast after undoing a repost',
          }),
        )
      } else {
        haptics.confirm()
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionRepost',
          feedContext: postFeedContext,
          reqId: postReqId,
        })
        await queueRepost()
        Toast.show(l({message: 'Reposted', context: 'Toast after reposting'}), {
          type: 'success',
        })
      }
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }

  const onQuote = () => {
    if (isBlocked) {
      showBlockedToast()
      return
    }
    haptics.confirm()
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionQuote',
      feedContext: postFeedContext,
      reqId: postReqId,
    })
    ax.metric('post:clickQuotePost', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext,
      feedDescriptor,
    })
    openComposer({quote: post, logContext: 'QuotePost'})
  }

  /**
   * Opens the share sheet on native. Web has no share sheet, so `shareUrl`
   * copies the link instead, and the item is labelled to match.
   */
  const onShare = () => {
    ax.metric('post:share', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext,
      feedDescriptor,
      postContext: 'feed',
    })
    if (IS_WEB) {
      ax.metric('share:press:copyLink', {})
    } else {
      ax.metric('share:press:nativeShare', {})
    }
    const {rkey} = new AtUri(post.uri)
    void shareUrl(toShareUrl(makeProfileLink(post.author, 'post', rkey)))
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionShare',
      feedContext: postFeedContext,
      reqId: postReqId,
    })
  }

  const onBookmark = async () => {
    if ((await toggleBookmark()) === 'saved') {
      Toast.show(l`Added to saved posts`, {type: 'success'})
    }
  }

  const repostLabel = isReposted
    ? l`Undo repost`
    : l({message: 'Repost', context: 'action'})
  const quoteLabel = embeddingDisabled ? l`Quote posts disabled` : l`Quote post`
  const shareLabel = IS_WEB ? l`Copy link to post` : l`Share`
  const bookmarkLabel = isBookmarked
    ? l`Remove from saved posts`
    : l`Add to saved posts`

  return (
    <>
      <Menu.Group>
        <Menu.Item
          testID="postDropdownRepostBtn"
          label={repostLabel}
          onPress={() => requireAuth(() => void onRepost())}>
          <Menu.ItemText>{repostLabel}</Menu.ItemText>
          <Menu.ItemIcon icon={RepostIcon} position="right" />
        </Menu.Item>
        <Menu.Item
          testID="postDropdownQuoteBtn"
          label={quoteLabel}
          disabled={embeddingDisabled}
          onPress={() => requireAuth(onQuote)}>
          <Menu.ItemText>{quoteLabel}</Menu.ItemText>
          <Menu.ItemIcon icon={QuoteIcon} position="right" />
        </Menu.Item>
        <Menu.Item
          testID="postDropdownSharePostBtn"
          label={shareLabel}
          onPress={onShare}>
          <Menu.ItemText>{shareLabel}</Menu.ItemText>
          <Menu.ItemIcon
            icon={IS_WEB ? ChainLinkIcon : ShareIcon}
            position="right"
          />
        </Menu.Item>
        <Menu.Item
          testID="postDropdownBookmarkBtn"
          label={bookmarkLabel}
          onPress={() => requireAuth(() => void onBookmark())}>
          <Menu.ItemText>{bookmarkLabel}</Menu.ItemText>
          <Menu.ItemIcon
            icon={isBookmarked ? BookmarkFilledIcon : BookmarkIcon}
            position="right"
          />
        </Menu.Item>
      </Menu.Group>
      <Menu.Divider />
    </>
  )
}
