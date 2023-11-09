import {useEffect, useState, useCallback, useRef} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyFeedDefs} from '@atproto/api'

const emitter = new EventEmitter()

export interface PostShadow {
  likeUri: string | undefined
  likeCount: number | undefined
  repostUri: string | undefined
  repostCount: number | undefined
  isDeleted: boolean
}

export type UpdatePostShadowFn = (cache: Partial<PostShadow>) => void

interface CacheEntry {
  ts: number
  value: PostShadow
}

export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
  ifAfterTS: number,
): PostShadow {
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

  return state.ts > ifAfterTS ? state.value : fromPost(post)
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  emitter.emit(uri, value)
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
