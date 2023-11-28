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
  useEffect(() => {
    function onChange() {
      // TODOO
    }

    const unsub = addListener(post.uri, onChange)
    return unsub
  }, [post.uri])

  return post
}

function addListener(uri, onChange) {
  let record
  if (map.has(uri)) {
    record = map.get(uri)
  } else {
    record = {listeners: []}
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
  // TODO
}
