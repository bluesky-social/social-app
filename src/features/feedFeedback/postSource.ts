import {useEffect, useState} from 'react'
import {type AtIdentifierString, AtUri} from '@atproto/syntax'

import {Logger} from '#/logger'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {type FeedItem, repostVia} from '#/features/feedFeedback'
import {type app} from '#/lexicons'

/**
 * Separate logger for better debugging
 */
const logger = Logger.create(Logger.Context.PostSource)

/**
 * The feed item a post was opened from, handed from the feed to the thread
 * screen. Used for feed feedback, `via` on likes and reposts, and analytics,
 * none of which are critical, so a lost source only loses attribution.
 */
export type PostSource = {
  post: app.bsky.feed.defs.FeedViewPost
  feedSourceInfo?: FeedSourceInfo
}

/**
 * How long a stashed source waits for the thread screen to take it. Opening a
 * thread takes well under this, so an older source is from a navigation that
 * never happened, and shouldn't attach to a later open of the same post.
 */
const SOURCE_TTL_MS = 10e3

type Entry = {source: PostSource; stashedAt: number}

/**
 * Stashed sources, keyed by every form of the post's URI that a thread route
 * can have: with the author's DID, and with their handle.
 */
const sources = new Map<string, Entry>()

/**
 * Stashes the feed item a post is being opened from, for the thread screen
 * that opens next.
 */
export function stashPostSource(source: PostSource) {
  pruneExpired()
  const entry: Entry = {source, stashedAt: Date.now()}
  for (const key of keysFor(source)) {
    sources.set(key, entry)
  }
  logger.debug('stash', {uri: source.post.post.uri})
}

/**
 * The source the post at `uri` was opened from, if it was opened from a feed
 * item. A screen keeps its source for as long as it is mounted, and takes it
 * from the stash once mounted, so a later open of the same post doesn't get it.
 */
export function usePostSource(uri: string) {
  const [source] = useState(() => peek(uri))

  useEffect(() => {
    if (!source) return
    for (const key of keysFor(source)) {
      // A newer stash for the same post belongs to a different navigation.
      if (sources.get(key)?.source === source) {
        sources.delete(key)
      }
    }
    logger.debug('take', {uri: source.post.post.uri})
  }, [source])

  return source
}

/**
 * The feed item a post source describes, for `FeedItemProvider`.
 */
export function feedItemFromPostSource({post: feedPost}: PostSource): FeedItem {
  return {
    uri: feedPost.post.uri,
    authorDid: feedPost.post.author.did,
    feedContext: feedPost.feedContext,
    reqId: feedPost.reqId,
    via: repostVia(feedPost.reason),
  }
}

function peek(uri: string) {
  const key = normalize(uri)
  if (!key) return
  const entry = sources.get(key)
  if (!entry || Date.now() - entry.stashedAt > SOURCE_TTL_MS) return
  return entry.source
}

function pruneExpired() {
  const now = Date.now()
  for (const [key, entry] of sources) {
    if (now - entry.stashedAt > SOURCE_TTL_MS) {
      sources.delete(key)
    }
  }
}

/**
 * The URIs a thread route for this source's post can have. Links to a post
 * use the author's handle where they have a valid one, and their DID
 * otherwise.
 */
function keysFor({post: feedPost}: PostSource): string[] {
  const keys = new Set<string>()
  const byDid = normalize(feedPost.post.uri)
  if (byDid) keys.add(byDid)
  const urip = new AtUri(feedPost.post.uri)
  urip.host = feedPost.post.author.handle
  const byHandle = normalize(urip.toString())
  if (byHandle) keys.add(byHandle)
  return [...keys]
}

/**
 * Handles are case-insensitive, so a route's handle may not match the case in
 * the post's data.
 */
function normalize(uri: string) {
  try {
    const urip = new AtUri(uri)
    urip.host = urip.host.toLowerCase() as AtIdentifierString
    return urip.toString()
  } catch {
    return undefined
  }
}
