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
  const [prevPost, setPrevPost] = useState(post)
  const [shadow, setShadow] = useState(() => computeShadow(post))
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(computeShadow(post))
  }

  useEffect(() => {
    function onChange() {
      setShadow(computeShadow(post))
    }
    const unsub = addListener(post, onChange)
    return () => {
      unsub()
    }
  }, [post])

  // TODO: memoize
  // TODO: types, cast to shadow
  return mergeShadow(post, shadow)
}

function mergeShadow(post, shadow) {
  if (!shadow) {
    return post
  }
  return {
    ...post,
    likeCount: 'likeCount' in shadow ? shadow.likeCount : post.likeCount,
    repostCount:
      'repostCount' in shadow ? shadow.repostCount : post.repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
    },
  }
}

function computeShadow(post) {
  const queue = findQueue(post)
  const postTS = getFirstSeenTS(post)
  let acc = {}
  let node = queue
  while (node && node.value) {
    if (node.timestamp > postTS) {
      Object.assign(acc, node.value)
    }
    node = node.next
  }
  return acc
}

let queueByPost = new WeakMap()
let recordByUri = new Map()

function findQueue(post) {
  if (queueByPost.has(post)) {
    return queueByPost.get(post)
  }
  let queue
  if (recordByUri.has(post.uri)) {
    queue = recordByUri.get(post.uri).queue
  } else {
    queue = {value: null, next: null, timestamp: null}
  }
  queueByPost.set(post, queue)
  return queue
}

function addListener(post, onChange) {
  const uri = post.uri
  const queue = findQueue(post)
  let record
  if (recordByUri.has(uri)) {
    record = recordByUri.get(uri)
  } else {
    record = {queue, listeners: []}
    recordByUri.set(uri, record)
  }
  record.listeners.push(onChange)
  return () => {
    record.listeners = record.listeners.filter(l => l !== onChange)
    if (record.listeners.length === 0) {
      recordByUri.delete(uri)
    }
  }
}

export function updatePostShadow(uri: string, value: Partial<PostShadow>) {
  const record = recordByUri.get(uri)
  if (!record) {
    return
  }
  let tail = record.queue
  while (tail.next) {
    tail = tail.next
  }
  tail.value = value
  tail.timestamp = Date.now()
  tail.next = {value: null, next: null, timestamp: null}
  batchedUpdates(() => {
    record.listeners.forEach(l => l())
  })
}
