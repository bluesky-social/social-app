import {useEffect, useState} from 'react'
import {AtUri} from '@atproto/syntax'

/*
 * On iOS, a post thread zooms out of whatever was tapped to open it, when that
 * was a feed item or a quote embed. Those wrap themselves in a
 * `ZoomTransition.Source` with a unique identifier and stash it here when
 * pressed, and the thread screen that opens next takes it. Every other way of
 * opening a thread finds nothing here and keeps the normal push.
 */

/**
 * How long a stash waits for its thread screen. Opening a thread takes well
 * under this, so an older stash is from a navigation that never happened, and
 * shouldn't attach to a later open of the same post.
 */
const TTL_MS = 10e3

type Pending = {
  did: string
  handle: string
  rkey: string
  identifier: string
  stashedAt: number
}

/**
 * Only one thread opens per press, so only the latest press matters.
 */
let pending: Pending | undefined

/**
 * Stashes the `ZoomTransition.Source` identifier a post is being opened from,
 * for the thread screen that opens next.
 */
export function stashPostZoomSource({
  post,
  identifier,
}: {
  post: {uri: string; author: {did: string; handle: string}}
  identifier: string
}) {
  pending = {
    did: post.author.did,
    handle: post.author.handle,
    rkey: new AtUri(post.uri).rkey,
    identifier,
    stashedAt: Date.now(),
  }
}

/**
 * The identifier of the zoom source the post at `uri` was opened from, if any.
 * A screen keeps it for as long as it is mounted, and takes it from the stash
 * once mounted, so a later open of the same post doesn't get it.
 */
export function usePostZoomSource(uri: string) {
  const [entry] = useState(() => peek(uri))

  useEffect(() => {
    if (entry && pending === entry) {
      pending = undefined
    }
  }, [entry])

  return entry?.identifier
}

function peek(uri: string) {
  if (!pending || Date.now() - pending.stashedAt > TTL_MS) return
  let urip: AtUri
  try {
    urip = new AtUri(uri)
  } catch {
    return
  }
  if (urip.rkey !== pending.rkey) return
  /*
   * Links to a post use the author's handle where they have a valid one, and
   * their DID otherwise. Handles are case-insensitive, so a route's handle may
   * not match the case in the post's data.
   */
  if (
    urip.host === pending.did ||
    urip.host.toLowerCase() === pending.handle.toLowerCase()
  ) {
    return pending
  }
}
