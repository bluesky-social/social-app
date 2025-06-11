import {useEffect, useId, useState} from 'react'
import {type AppBskyFeedDefs, AtUri} from '@atproto/api'

import {Logger} from '#/logger'
import {type FeedDescriptor} from '#/state/queries/post-feed'

/**
 * Separate logger for better debugging
 */
const logger = Logger.create(Logger.Context.PostSource)

export type PostSource = {
  post: AppBskyFeedDefs.FeedViewPost
  feed?: FeedDescriptor
}

/**
 * A cache of sources that will be consumed by the post thread view. This is
 * cleaned up any time a source is consumed.
 */
const transientSources = new Map<string, PostSource>()

/**
 * A cache of sources that have been consumed by the post thread view. This is
 * not cleaned up, but because we use a new ID for each post thread view that
 * consumes a source, this is never reused unless a user navigates back to a
 * post thread view that has not been dropped from memory.
 */
const consumedSources = new Map<string, PostSource>()

/**
 * For stashing the feed that the user was browsing when they clicked on a post.
 *
 * Used for FeedFeedback and other ephemeral non-critical systems.
 */
export function setUnstablePostSource(key: string, source: PostSource) {
  assertValidDevOnly(
    key,
    `setUnstablePostSource key should be a URI containing a handle, received ${key} — use buildPostSourceKey`,
  )
  logger.debug('set', {key, source})
  transientSources.set(key, source)
}

/**
 * This hook is unstable and should only be used for FeedFeedback and other
 * ephemeral non-critical systems. Views that use this hook will continue to
 * return a reference to the same source until those views are dropped from
 * memory.
 */
export function useUnstablePostSource(key: string) {
  const id = useId()
  const [source] = useState(() => {
    assertValidDevOnly(
      key,
      `consumeUnstablePostSource key should be a URI containing a handle, received ${key} — be sure to use buildPostSourceKey when setting the source`,
      true,
    )
    const source = consumedSources.get(id) || transientSources.get(key)
    if (source) {
      logger.debug('consume', {id, key, source})
      transientSources.delete(key)
      consumedSources.set(id, source)
    }
    return source
  })

  useEffect(() => {
    return () => {
      consumedSources.delete(id)
      logger.debug('cleanup', {id})
    }
  }, [id])

  return source
}

/**
 * Builds a post source key. This (atm) is a URI where the `host` is the post
 * author's handle, not DID.
 */
export function buildPostSourceKey(key: string, handle: string) {
  const urip = new AtUri(key)
  urip.host = handle
  return urip.toString()
}

/**
 * Just a lil dev helper
 */
function assertValidDevOnly(key: string, message: string, beChill = false) {
  if (__DEV__) {
    const urip = new AtUri(key)
    if (urip.host.startsWith('did:')) {
      if (beChill) {
        logger.warn(message)
      } else {
        throw new Error(message)
      }
    }
  }
}
