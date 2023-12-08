import {useEffect, useState, useMemo} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyFeedDefs} from '@atproto/api'
import {batchedUpdates} from '#/lib/batchedUpdates'
import {Shadow, castAsShadow} from './types'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '../queries/notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '../queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInThreadQueryData} from '../queries/post-thread'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '../queries/search-posts'
import {queryClient} from 'lib/react-query'
export type {Shadow} from './types'

export interface PostShadow {
  likeUri: string | undefined
  likeCount: number | undefined
  repostUri: string | undefined
  repostCount: number | undefined
  isDeleted: boolean
}

export const POST_TOMBSTONE = Symbol('PostTombstone')

const emitter = new EventEmitter()
const shadows: WeakMap<
  AppBskyFeedDefs.PostView,
  Partial<PostShadow>
> = new WeakMap()

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
  return castAsShadow({
    ...post,
    likeCount: 'likeCount' in shadow ? shadow.likeCount : post.likeCount,
    repostCount:
      'repostCount' in shadow ? shadow.repostCount : post.repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
    },
  })
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  const cachedPosts = findPostsInCache(uri)
  for (let post of cachedPosts) {
    shadows.set(post, {...shadows.get(post), ...value})
  }
  batchedUpdates(() => {
    emitter.emit(uri)
  })
}

function* findPostsInCache(
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
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield post
  }
}
