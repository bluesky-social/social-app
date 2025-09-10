import {useEffect, useMemo, useState} from 'react'
import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'
import EventEmitter from 'eventemitter3'

import {batchedUpdates} from '#/lib/batchedUpdates'
import {findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '#/state/queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {findAllPostsInQueryData as findAllPostsInThreadQueryData} from '#/state/queries/post-thread'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts'
import {findAllPostsInQueryData as findAllPostsInThreadV2QueryData} from '#/state/queries/usePostThread/queryCache'
import {castAsShadow, type Shadow} from './types'
export type {Shadow} from './types'

export interface PostShadow {
  likeUri: string | undefined
  repostUri: string | undefined
  isDeleted: boolean
  embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined
  pinned: boolean
  optimisticReplyCount: number | undefined
  bookmarked: boolean | undefined
}

export const POST_TOMBSTONE = Symbol('PostTombstone')

const emitter = new EventEmitter()
const shadows: WeakMap<
  AppBskyFeedDefs.PostView,
  Partial<PostShadow>
> = new WeakMap()

/**
 * Use with caution! This function returns the raw shadow data for a post.
 * Prefer using `usePostShadow`.
 */
export function dangerousGetPostShadow(post: AppBskyFeedDefs.PostView) {
  return shadows.get(post)
}

export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  const [shadow, setShadow] = useState(() => shadows.get(post))
  const [prevPost, setPrevPost] = useState(post)
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(shadows.get(post))
  }

  useEffect(() => {
    function onUpdate() {
      setShadow(shadows.get(post))
    }
    emitter.addListener(post.uri, onUpdate)
    return () => {
      emitter.removeListener(post.uri, onUpdate)
    }
  }, [post, setShadow])

  return useMemo(() => {
    if (shadow) {
      return mergeShadow(post, shadow)
    } else {
      return castAsShadow(post)
    }
  }, [post, shadow])
}

function mergeShadow(
  post: AppBskyFeedDefs.PostView,
  shadow: Partial<PostShadow>,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  if (shadow.isDeleted) {
    return POST_TOMBSTONE
  }

  let likeCount = post.likeCount ?? 0
  if ('likeUri' in shadow) {
    const wasLiked = !!post.viewer?.like
    const isLiked = !!shadow.likeUri
    if (wasLiked && !isLiked) {
      likeCount--
    } else if (!wasLiked && isLiked) {
      likeCount++
    }
    likeCount = Math.max(0, likeCount)
  }

  let bookmarkCount = post.bookmarkCount ?? 0
  if ('bookmarked' in shadow) {
    const wasBookmarked = !!post.viewer?.bookmarked
    const isBookmarked = !!shadow.bookmarked
    if (wasBookmarked && !isBookmarked) {
      bookmarkCount--
    } else if (!wasBookmarked && isBookmarked) {
      bookmarkCount++
    }
    bookmarkCount = Math.max(0, bookmarkCount)
  }

  let repostCount = post.repostCount ?? 0
  if ('repostUri' in shadow) {
    const wasReposted = !!post.viewer?.repost
    const isReposted = !!shadow.repostUri
    if (wasReposted && !isReposted) {
      repostCount--
    } else if (!wasReposted && isReposted) {
      repostCount++
    }
    repostCount = Math.max(0, repostCount)
  }

  let replyCount = post.replyCount ?? 0
  if ('optimisticReplyCount' in shadow) {
    replyCount = shadow.optimisticReplyCount ?? replyCount
  }

  let embed: typeof post.embed
  if ('embed' in shadow) {
    if (
      (AppBskyEmbedRecord.isView(post.embed) &&
        AppBskyEmbedRecord.isView(shadow.embed)) ||
      (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedRecordWithMedia.isView(shadow.embed))
    ) {
      embed = shadow.embed
    }
  }

  return castAsShadow({
    ...post,
    embed: embed || post.embed,
    likeCount: likeCount,
    repostCount: repostCount,
    replyCount: replyCount,
    bookmarkCount: bookmarkCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
      pinned: 'pinned' in shadow ? shadow.pinned : post.viewer?.pinned,
      bookmarked:
        'bookmarked' in shadow ? shadow.bookmarked : post.viewer?.bookmarked,
    },
  })
}

export function updatePostShadow(
  queryClient: QueryClient,
  uri: string,
  value: Partial<PostShadow>,
) {
  const cachedPosts = findPostsInCache(queryClient, uri)
  for (let post of cachedPosts) {
    shadows.set(post, {...shadows.get(post), ...value})
  }
  batchedUpdates(() => {
    emitter.emit(uri)
  })
}

function* findPostsInCache(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield post
  }
  for (let node of findAllPostsInThreadQueryData(queryClient, uri)) {
    if (node.type === 'post') {
      yield node.post
    }
  }
  for (let post of findAllPostsInThreadV2QueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield post
  }
}
