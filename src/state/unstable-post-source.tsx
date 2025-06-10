import {createContext, useCallback, useContext, useId, useState} from 'react'
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
const SetUnstablePostSourceContext = createContext<
  (key: string, source: PostSource) => void
>(() => {})
const ConsumeUnstablePostSourceContext = createContext<
  (key: string, id: string) => PostSource | undefined
>(() => undefined)

/**
 * A cache of sources that will be consumed by the post thread view. This is
 * cleaned up any time a source is consumed.
 */
const transientSourcesRef = new Map<string, PostSource>()

/**
 * A cache of sources that have been consumed by the post thread view. This is
 * not cleaned up, but because we use a new ID for each post thread view that
 * consumes a source, this is never reused unless a user navigates back to a
 * post thread view that has not been dropped from memory.
 */
const consumedSourcesRef = new Map<string, PostSource>()

/**
 * For passing the source of the post (i.e. the original post, from the feed)
 * to the threadview, without using query params. Deliberately unstable to
 * avoid using query params, use for FeedFeedback and other ephemeral
 * non-critical systems.
 */
export function Provider({children}: {children: React.ReactNode}) {
  const setUnstablePostSource = useCallback(
    (key: string, source: PostSource) => {
      assertValid(
        key,
        `setUnstablePostSource key should be a URI containing a handle, received ${key} — use buildPostSourceKey`,
      )
      logger.debug('set', {key, source})
      transientSourcesRef.set(key, source)
    },
    [],
  )

  const consumeUnstablePostSource = useCallback((key: string, id: string) => {
    assertValid(
      key,
      `consumeUnstablePostSource key should be a URI containing a handle, received ${key} — use buildPostSourceKey`,
    )
    const source = consumedSourcesRef.get(id) || transientSourcesRef.get(key)
    if (source) {
      logger.debug('consume', {key, source})
      transientSourcesRef.delete(key)
      consumedSourcesRef.set(id, source)
    }
    return source
  }, [])

  return (
    <SetUnstablePostSourceContext.Provider value={setUnstablePostSource}>
      <ConsumeUnstablePostSourceContext.Provider
        value={consumeUnstablePostSource}>
        {children}
      </ConsumeUnstablePostSourceContext.Provider>
    </SetUnstablePostSourceContext.Provider>
  )
}

export function useSetUnstablePostSource() {
  return useContext(SetUnstablePostSourceContext)
}

/**
 * DANGER - This hook is unstable and should only be used for FeedFeedback
 * and other ephemeral non-critical systems. Does not change when the URI changes.
 */
export function useUnstablePostSource(key: string) {
  const id = useId()
  const consume = useContext(ConsumeUnstablePostSourceContext)
  const [source] = useState(() => consume(key, id))
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

function assertValid(key: string, message: string) {
  if (__DEV__) {
    const urip = new AtUri(key)
    if (urip.host.startsWith('did:')) {
      throw new Error(message)
    }
  }
}
