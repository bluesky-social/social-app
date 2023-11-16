import {useEffect, useState, useCallback, useRef} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyFeedDefs} from '@atproto/api'
import {Shadow} from './types'
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
  ifAfterTS: number,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  const [state, setState] = useState<CacheEntry>({
    ts: Date.now(),
    value: fromPost(post),
  })
  const firstRun = useRef(true)

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

  // react to post updates
  useEffect(() => {
    // dont fire on first run to avoid needless re-renders
    if (!firstRun.current) {
      setState({ts: Date.now(), value: fromPost(post)})
    }
    firstRun.current = false
  }, [post])

  return state.ts > ifAfterTS
    ? mergeShadow(post, state.value)
    : {...post, isShadowed: true}
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  emitter.emit(uri, value)
}

export function isPostShadowed(
  v: AppBskyFeedDefs.PostView | Shadow<AppBskyFeedDefs.PostView>,
): v is Shadow<AppBskyFeedDefs.PostView> {
  return 'isShadowed' in v && !!v.isShadowed
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
  return {
    ...post,
    likeCount: shadow.likeCount,
    repostCount: shadow.repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: shadow.likeUri,
      repost: shadow.repostUri,
    },
    isShadowed: true,
  }
}
