import {moderatePost, type ModerationOpts} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {IS_NATIVE} from '#/env'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * Whether a post can be shared as an image. Not for posts that would be
 * blurred, or from authors who've asked not to be shown to logged-out people:
 * an image outlives both. The same goes for a post it quotes.
 */
export function useCanSharePostImage(post: app.bsky.feed.defs.PostView) {
  const moderationOpts = useModerationOpts()
  if (!IS_NATIVE || !moderationOpts) return false

  const quoted = getQuotedPostView(post)
  return (
    isShareable(post, moderationOpts) &&
    (!quoted || isShareable(quoted, moderationOpts))
  )
}

function isShareable(
  post: app.bsky.feed.defs.PostView,
  moderationOpts: ModerationOpts,
) {
  const isLoggedInOnly = !!post.author.labels?.some(
    label => label.val === '!no-unauthenticated',
  )
  if (isLoggedInOnly) return false

  const moderation = moderatePost(post, moderationOpts)
  return !(
    moderation.ui('contentList').blur ||
    moderation.ui('contentView').blur ||
    moderation.ui('contentMedia').blur
  )
}

/**
 * The post this one quotes, as a post view. Moderating the quoting post only
 * downgrades the quote's labels (they'd blur the quote, not the whole post),
 * so the quote needs its own check before it's drawn into the image.
 */
function getQuotedPostView(
  post: app.bsky.feed.defs.PostView,
): app.bsky.feed.defs.PostView | undefined {
  const embed = post.embed
  const record = bsky.isType(app.bsky.embed.record.view, embed)
    ? embed.record
    : bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
      ? embed.record.record
      : undefined
  if (!record || !bsky.isType(app.bsky.embed.record.viewRecord, record)) return
  return {
    ...record,
    $type: 'app.bsky.feed.defs#postView',
    record: record.value,
    embed: record.embeds?.[0],
  }
}
