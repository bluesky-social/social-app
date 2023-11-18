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

const firstSeenMap = new WeakMap<AppBskyFeedDefs.PostView, number>()
function getFirstSeenTS(post: AppBskyFeedDefs.PostView): number {
  let timeStamp = firstSeenMap.get(post)
  if (timeStamp !== undefined) {
    return timeStamp
  }
  timeStamp = Date.now()
  firstSeenMap.set(post, timeStamp)
  return timeStamp
}

export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  const postSeenTS = getFirstSeenTS(post)
  const [state, setState] = useState<CacheEntry>(() => ({
    ts: postSeenTS,
    value: fromPost(post),
  }))

  const [prevPost, setPrevPost] = useState(post)
  if (post !== prevPost) {
    // if we got a new prop, assume it's fresher
    // than whatever shadow state we accumulated
    setPrevPost(post)
    setState({
      ts: postSeenTS,
      value: fromPost(post),
    })
  }

  const onUpdate = useCallback(
    (value: Partial<PostShadow>) => {
      setState(s => ({ts: Date.now(), value: {...s.value, ...value}}))
    },
    [setState],
  )

  // react to shadow updates
  useEffect(() => {
    emitter.addListener(post.uri, onUpdate)
    return () => {
      emitter.removeListener(post.uri, onUpdate)
    }
  }, [post.uri, onUpdate])

  return useMemo(() => {
    return state.ts > postSeenTS
      ? mergeShadow(post, state.value)
      : castAsShadow(post)
  }, [post, state, postSeenTS])
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  batchedUpdates(() => {
    emitter.emit(uri, value)
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
