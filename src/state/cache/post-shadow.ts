import {useEffect, useState, useMemo, useCallback} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyFeedDefs} from '@atproto/api'
import {batchedUpdates} from '#/lib/batchedUpdates'
import {Shadow, castAsShadow} from './types'
export type {Shadow} from './types'

const emitter = new EventEmitter()

export interface PostShadow {
  likeUri: string | undefined
  likeCount: number | undefined
  repostUri: string | undefined
  repostCount: number | undefined
  isDeleted: boolean
}

export const POST_TOMBSTONE = Symbol('PostTombstone')

interface CacheEntry {
  ts: number
  value: PostShadow
}

export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  // TODO
  return post
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  batchedUpdates(() => {
    // TODO
  })
}

function fromPost(post: AppBskyFeedDefs.PostView): PostShadow {
  return {
    likeUri: post.viewer?.like,
    likeCount: post.likeCount,
    repostUri: post.viewer?.repost,
    repostCount: post.repostCount,
    isDeleted: false,
  }
}

function mergeShadow(
  post: AppBskyFeedDefs.PostView,
  shadow: PostShadow,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  if (shadow.isDeleted) {
    return POST_TOMBSTONE
  }
  return castAsShadow({
    ...post,
    likeCount: shadow.likeCount,
    repostCount: shadow.repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: shadow.likeUri,
      repost: shadow.repostUri,
    },
  })
}
