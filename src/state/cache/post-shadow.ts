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
  const [shadow, setShadow] = useState(() => {
    const record = map.get(post.uri)
    if (!record) {
      return null
    }
    return record.shadow
  })

  useEffect(() => {
    function onChange(s) {
      setShadow(s)
    }
    const unsub = addListener(post.uri, onChange)
    return () => {
      unsub()
    }
  }, [post.uri])

  return mergeShadow(post, shadow)
}

function mergeShadow(post, shadow) {
  if (!shadow) {
    return post
  }
  return {
    ...post,
    likeCount: shadow.likeCount ?? post.likeCount,
    repostCount: shadow.repostCount ?? post.repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: shadow.likeUri,
      repost: shadow.repostUri,
    },
  }
}

function addListener(uri, onChange) {
  let record
  if (map.has(uri)) {
    record = map.get(uri)
  } else {
    record = {listeners: [], shadow: null}
    map.set(uri, record)
  }
  record.listeners.push(onChange)
  return () => {
    record.listeners = record.listeners.filter(l => l !== onChange)
    if (record.listeners.length === 0) {
      map.delete(uri)
    }
  }
}

const map = new Map()

console.log(map)

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  const record = map.get(uri)
  if (!record) {
    return
  }
  record.shadow = {...record.shadow, ...value}
  batchedUpdates(() => {
    record.listeners.forEach(l => l(record.shadow))
  })
}
