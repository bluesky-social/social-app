import {useEffect} from 'react'
import {type Agent, AppBskyActorDefs, asPredicate} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import {IS_WEB} from '#/env'
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
    if (env.IS_DEV && IS_WEB && typeof window !== 'undefined') {
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
      /*
       * `onSettled` runs after the mutation completes, success or no. The idea
       * here is that we want to invert the action that was just passed in, and
       * provide it as an `undoAction` to the `onUpdateSuccess` callback.
       *
       * If the operation was not a success, we don't provide the `undoAction`.
       *
       * Upon the first call of the mutation, the `__canUndo` flag is undefined,
       * so we allow the undo. However, when we create the `undoAction`, we
       * set its `__canUndo` flag to false, so that if the user were to call
       * the undo action, we would not provide another undo for that.
       */
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
      const prefs = updated.find(p =>
        asPredicate(AppBskyActorDefs.validateLiveEventPreferences)(p),
      )

      switch (action.type) {
        case 'hideFeed':
        case 'unhideFeed': {
          if (!props.feed) {
            logger.error(
              `useUpdateLiveEventPreferences: feed is missing, but required for hiding/unhiding`,
              {
                action,
              },
            )
            break
          }

          logger.metric(
            action.type === 'hideFeed'
              ? 'liveEvents:feedBanner:hide'
              : 'liveEvents:feedBanner:unhide',
            {
              feed: props.feed.url,
              context: props.metricContext,
            },
          )
          break
        }
        case 'toggleHideAllFeeds': {
          if (prefs!.hideAllFeeds) {
            logger.metric('liveEvents:hideAllFeedBanners', {
              context: props.metricContext,
            })
          } else {
            logger.metric('liveEvents:unhideAllFeedBanners', {
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

      return prefs!
    },
  })
}
