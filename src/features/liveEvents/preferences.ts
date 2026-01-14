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
>[0] & {
  /**
   * Flag that is internal to this hook, do not set when updating prefs
   */
  __canUndo?: boolean
}

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
  onUpdateSuccess?: (props: {
    undoAction: LiveEventPreferencesAction | null
  }) => void
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<
    AppBskyActorDefs.LiveEventPreferences,
    Error,
    LiveEventPreferencesAction,
    {undoAction: LiveEventPreferencesAction | null}
  >({
    onSettled(data, error, variables) {
      // If __canUndo is not explicitly set to false, we allow undo
      const canUndo = variables.__canUndo === undefined ? true : false
      let undoAction: LiveEventPreferencesAction | null = null

      switch (variables.type) {
        case 'hideFeed':
          undoAction = {type: 'unhideFeed', id: variables.id, __canUndo: false}
          break
        case 'unhideFeed':
          undoAction = {type: 'hideFeed', id: variables.id, __canUndo: false}
          break
        case 'toggleHideAllFeeds':
          undoAction = {type: 'toggleHideAllFeeds', __canUndo: false}
          break
      }

      if (data && !error) {
        props?.onUpdateSuccess?.({
          undoAction: canUndo ? undoAction : null,
        })
      }
    },
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
