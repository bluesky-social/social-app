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
  const [shadow, setShadow] = useState(() =>
    computeShadow(post, findChain(post)),
  )
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(computeShadow(post, findChain(post)))
  }

  useEffect(() => {
    function onChange(updatedChain) {
      setShadow(computeShadow(post, updatedChain))
    }
    const unsub = addListener(post.uri, onChange)
    return () => {
      unsub()
    }
  }, [post])

  return mergeShadow(post, shadow)
}

function findChain(post) {
  const record = map.get(post.uri)
  if (!record) {
    return null
  }
  return record.chain
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

function computeShadow(post, chain) {
  const postTS = getFirstSeenTS(post)
  let acc = {}
  while (chain && chain.value) {
    if (chain.timestamp > postTS) {
      Object.assign(acc, chain.value)
    }
    chain = chain.next
  }
  return acc
}

function addListener(uri, onChange) {
  let record
  if (map.has(uri)) {
    record = map.get(uri)
  } else {
    record = {listeners: [], chain: {value: null, next: null, timestamp: null}}
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
  let node = record.chain
  while (node.next) {
    node = node.next
  }
  node.value = value
  node.timestamp = Date.now()
  node.next = {value: null, next: null, timestamp: null}
  batchedUpdates(() => {
    record.listeners.forEach(l => l(record.chain))
  })
}
