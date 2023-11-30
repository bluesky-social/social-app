import {useEffect, useState, useMemo, useCallback} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyFeedDefs} from '@atproto/api'
import {batchedUpdates} from '#/lib/batchedUpdates'
import {Shadow, castAsShadow} from './types'
import {queryClient} from 'lib/react-query'
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

let shadows = new WeakMap()

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
  }, [post])

  return useMemo(() => {
    if (shadow) {
      return mergeShadow(post, shadow)
    } else {
      return castAsShadow(post)
    }
  }, [post, shadow])
}

function findPosts(uri) {
  const found = []
  for (let [key, data] of queryClient.getQueriesData()) {
    if (!data) {
      continue
    }
    switch (key[0]) {
      case 'post-feed': {
        for (let page of data.pages) {
          for (let slice of page.slices) {
            for (let item of slice.items) {
              const post = item.post
              if (post.uri === uri) {
                found.push(post)
              }
            }
          }
        }
        break
      }
      case 'post-thread': {
        if (data.post.uri === uri) {
          found.push(data.post)
        }
        for (let reply of data.replies) {
          if (reply.post.uri === uri) {
            found.push(reply.post)
          }
        }
        break
      }
    }
  }
  return found
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  const matches = findPosts(uri)
  for (let post of matches) {
    shadows.set(post, {...shadows.get(post), ...value})
  }

  batchedUpdates(() => {
    emitter.emit(uri)
  })
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
