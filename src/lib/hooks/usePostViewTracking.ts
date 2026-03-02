import {useCallback, useRef} from 'react'
import {type AppBskyFeedDefs} from '@atproto/api'

import {type Metrics, useAnalytics} from '#/analytics'

/**
 * Hook that returns a callback to track post:view events.
 * Handles deduplication so the same post URI is only tracked once per mount.
 *
 * @param logContext - The context where the post is being viewed
 * @returns A callback that accepts a post and logs the view event
 */
export function usePostViewTracking(
  logContext: Metrics['post:view']['logContext'],
) {
  const ax = useAnalytics()
  const seenUrisRef = useRef(new Set<string>())

  const trackPostView = useCallback(
    (post: AppBskyFeedDefs.PostView) => {
      if (seenUrisRef.current.has(post.uri)) return
      seenUrisRef.current.add(post.uri)

      ax.metric('post:view', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext,
      })
    },
    [ax, logContext],
  )

  return trackPostView
}
