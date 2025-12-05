import {useCallback, useRef} from 'react'
import {type AppBskyFeedDefs} from '@atproto/api'

import {logger} from '#/logger'
import {type MetricEvents} from '#/logger/metrics'

/**
 * Hook that returns a callback to track post:view events.
 * Handles deduplication so the same post URI is only tracked once per mount.
 *
 * @param logContext - The context where the post is being viewed
 * @returns A callback that accepts a post and logs the view event
 */
export function usePostViewTracking(
  logContext: MetricEvents['post:view']['logContext'],
) {
  const seenUrisRef = useRef(new Set<string>())

  const trackPostView = useCallback(
    (post: AppBskyFeedDefs.PostView) => {
      if (seenUrisRef.current.has(post.uri)) return
      seenUrisRef.current.add(post.uri)

      logger.metric(
        'post:view',
        {
          uri: post.uri,
          authorDid: post.author.did,
          logContext,
        },
        {statsig: false},
      )
    },
    [logContext],
  )

  return trackPostView
}
