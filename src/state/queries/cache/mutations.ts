import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
} from '@atproto/api'

import {type PostMutations} from '#/state/queries/cache/types'
import {DELETED_POST} from '#/state/queries/cache/util'

/**
 * Applies mutations to a post in the cache. If the post is deleted, returns a
 * symbol to force individual cache mutators to handle the unknown value
 * appropriately.
 */
export function mutatePost(
  post: AppBskyFeedDefs.PostView,
  mutations: Partial<PostMutations>,
): AppBskyFeedDefs.PostView | typeof DELETED_POST {
  if (mutations.isDeleted) {
    return DELETED_POST
  }

  let likeCount = post.likeCount ?? 0
  if ('likeUri' in mutations) {
    const wasLiked = !!post.viewer?.like
    const isLiked = !!mutations.likeUri
    if (wasLiked && !isLiked) {
      likeCount--
    } else if (!wasLiked && isLiked) {
      likeCount++
    }
    likeCount = Math.max(0, likeCount)
  }

  let repostCount = post.repostCount ?? 0
  if ('repostUri' in mutations) {
    const wasReposted = !!post.viewer?.repost
    const isReposted = !!mutations.repostUri
    if (wasReposted && !isReposted) {
      repostCount--
    } else if (!wasReposted && isReposted) {
      repostCount++
    }
    repostCount = Math.max(0, repostCount)
  }

  let embed: typeof post.embed
  if ('embed' in mutations) {
    if (
      (AppBskyEmbedRecord.isView(post.embed) &&
        AppBskyEmbedRecord.isView(mutations.embed)) ||
      (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedRecordWithMedia.isView(mutations.embed))
    ) {
      embed = mutations.embed
    }
  }

  return {
    ...post,
    embed: embed || post.embed,
    likeCount: likeCount,
    repostCount: repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in mutations ? mutations.likeUri : post.viewer?.like,
      repost:
        'repostUri' in mutations ? mutations.repostUri : post.viewer?.repost,
      pinned: 'pinned' in mutations ? mutations.pinned : post.viewer?.pinned,
    },
  }
}
