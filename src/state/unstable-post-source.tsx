import {createContext, useCallback, useContext, useRef, useState} from 'react'
import {type AppBskyFeedDefs,AtUri} from '@atproto/api'

import {Logger} from '#/logger'
import {type FeedDescriptor} from '#/state/queries/post-feed'

const logger = Logger.create(Logger.Context.PostSource)

/**
 * For passing the source of the post (i.e. the original post, from the feed) to the threadview,
 * without using query params. Deliberately unstable to avoid using query params, use for FeedFeedback
 * and other ephemeral non-critical systems.
 */

type Source = {
  post: AppBskyFeedDefs.FeedViewPost
  feed?: FeedDescriptor
}

const SetUnstablePostSourceContext = createContext<
  (uri: string, source: Source) => void
>(() => {})
const ConsumeUnstablePostSourceContext = createContext<
  (uri: string) => Source | undefined
>(() => undefined)

export function Provider({children}: {children: React.ReactNode}) {
  const sourcesRef = useRef<Map<string, Source>>(new Map())

  const setUnstablePostSource = useCallback((uri: string, source: Source) => {
    if (__DEV__) {
      const urip = new AtUri(uri)
      if (urip.host.startsWith('did:')) {
        throw new Error(
          `URI passed to setUnstablePostSource should contain a handle — use buildPostSourceUri`,
        )
      }
    }

    logger.debug('set', {uri, source})
    sourcesRef.current.set(uri, source)
  }, [])

  const consumeUnstablePostSource = useCallback((uri: string) => {
    if (__DEV__) {
      const urip = new AtUri(uri)
      if (urip.host.startsWith('did:')) {
        throw new Error(
          `URI passed to consumeUnstablePostSource should contain a handle — use buildPostSourceUri`,
        )
      }
    }

    const source = sourcesRef.current.get(uri)

    if (source) {
      logger.debug('consume', {uri, source})
      sourcesRef.current.delete(uri)
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
export function useUnstablePostSource(uri: string) {
  const consume = useContext(ConsumeUnstablePostSourceContext)

  const [source] = useState(() => consume(uri))
  return source
}

export function buildPostSourceUri(uri: string, handle: string) {
  const urip = new AtUri(uri)
  urip.host = handle
  return urip.toString()
}
