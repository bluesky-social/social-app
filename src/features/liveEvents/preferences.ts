import {useEffect} from 'react'
import {type Agent, type AppBskyActorDefs} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import * as env from '#/env'
import {
  type LiveEventFeed,
  type LiveEventFeedMetricContext,
} from '#/features/liveEvents/types'

export type LiveEventPreferencesAction = Parameters<
  Agent['updateLiveEventPreferences']
>[0]

export function useLiveEventPreferences() {
  const query = usePreferencesQuery()
  useWebOnlyDebugLiveEventPreferences()
  return {
    ...query,
    data: query.data?.liveEventPreferences || {
      hideAllFeeds: false,
      hiddenFeedIds: [],
    },
  }
}

function useWebOnlyDebugLiveEventPreferences() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      // @ts-ignore
      window.__updateLiveEventPreferences = async (
        action: LiveEventPreferencesAction,
      ) => {
        await agent.updateLiveEventPreferences(action)
        // triggers a refetch
        await queryClient.invalidateQueries({
          queryKey: preferencesQueryKey,
        })
      }
    }
  }, [agent, queryClient])
}

export function useUpdateLiveEventPreferences(props: {
  feed?: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<
    AppBskyActorDefs.LiveEventPreferences,
    Error,
    LiveEventPreferencesAction
  >({
    onError: props?.onError,
    onSuccess: props?.onSuccess,
    mutationFn: async action => {
      const updated = await agent.updateLiveEventPreferences(action)

      switch (action.type) {
        case 'hideFeed':
        case 'unhideFeed': {
          if (!props.feed) {
            if (env.IS_DEV) {
              throw new Error(
                'props.feed is required when calling hideFeed or unhideFeed',
              )
            }
            break
          }

          logger.metric(
            action.type === 'hideFeed'
              ? 'liveEvents:feed:hide'
              : 'liveEvents:feed:unhide',
            {
              feed: props.feed.url,
              context: props.metricContext,
            },
          )
          break
        }
        case 'toggleHideAllFeeds': {
          if (updated!.hideAllFeeds) {
            logger.metric('liveEvents:hideAllFeeds', {
              context: props.metricContext,
            })
          } else {
            logger.metric('liveEvents:unhideAllFeeds', {
              context: props.metricContext,
            })
          }
          break
        }
      }

      // triggers a refetch
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })

      return updated!
    },
  })
}
