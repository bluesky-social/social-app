import {useEffect} from 'react'
import {getPreferences, updateLiveEventPreferences} from '@bsky.app/sdk'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {usePdsClient} from '#/state/session'
import {useAnalytics} from '#/analytics'
import * as env from '#/env'
import {IS_WEB} from '#/env'
import {
  type LiveEventFeed,
  type LiveEventFeedMetricContext,
} from '#/features/liveEvents/types'
import {app} from '#/lexicons'

export type LiveEventPreferencesAction = Parameters<
  typeof updateLiveEventPreferences
>[1] & {
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
  const pdsClient = usePdsClient()

  useEffect(() => {
    if (env.IS_DEV && IS_WEB && typeof window !== 'undefined') {
      // @ts-ignore
      window.__updateLiveEventPreferences = async (
        action: LiveEventPreferencesAction,
      ) => {
        await pdsClient.call(updateLiveEventPreferences, action)
        // triggers a refetch
        await queryClient.invalidateQueries({
          queryKey: preferencesQueryKey,
        })
      }
    }
  }, [pdsClient, queryClient])
}

export function useUpdateLiveEventPreferences(props: {
  feed?: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
  onUpdateSuccess?: (props: {
    undoAction: LiveEventPreferencesAction | null
  }) => void
}) {
  const ax = useAnalytics()
  const queryClient = useQueryClient()
  const pdsClient = usePdsClient()

  return useMutation<
    app.bsky.actor.defs.LiveEventPreferences,
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
      /*
       * The SDK action returns void, so after applying the update we read the
       * fresh, interpreted preferences back to obtain the updated
       * `liveEventPreferences` (the SDK extracts it from the raw prefs array for
       * us, replacing the old `asPredicate(...).find(...)` lookup).
       */
      await pdsClient.call(updateLiveEventPreferences, action)
      const {liveEventPreferences: prefs} = await pdsClient.call(getPreferences)

      switch (action.type) {
        case 'hideFeed':
        case 'unhideFeed': {
          if (!props.feed) {
            ax.logger.error(
              `useUpdateLiveEventPreferences: feed is missing, but required for hiding/unhiding`,
              {
                action,
              },
            )
            break
          }

          ax.metric(
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
          if (prefs.hideAllFeeds) {
            ax.metric('liveEvents:hideAllFeedBanners', {
              context: props.metricContext,
            })
          } else {
            ax.metric('liveEvents:unhideAllFeedBanners', {
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

      return prefs
    },
  })
}
