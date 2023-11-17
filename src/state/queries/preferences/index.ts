import {useMemo} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {LabelPreference, BskyFeedViewPreference} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {getAge} from '#/lib/strings/time'
import {useSession, getAgent} from '#/state/session'
import {DEFAULT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {
  ConfigurableLabelGroup,
  UsePreferencesQueryResponse,
  ThreadViewPreferences,
} from '#/state/queries/preferences/types'
import {temp__migrateLabelPref} from '#/state/queries/preferences/util'
import {
  DEFAULT_HOME_FEED_PREFS,
  DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const'
import {getModerationOpts} from '#/state/queries/preferences/moderation'
import {STALE} from '#/state/queries'

export * from '#/state/queries/preferences/types'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/const'

export const usePreferencesQueryKey = ['getPreferences']

export function usePreferencesQuery() {
  const {hasSession} = useSession()
  return useQuery({
    enabled: hasSession,
    staleTime: STALE.MINUTES.ONE,
    queryKey: usePreferencesQueryKey,
    queryFn: async () => {
      const res = await getAgent().getPreferences()
      const preferences: UsePreferencesQueryResponse = {
        ...res,
        feeds: {
          saved: res.feeds?.saved || [],
          pinned: res.feeds?.pinned || [],
          unpinned:
            res.feeds.saved?.filter(f => {
              return !res.feeds.pinned?.includes(f)
            }) || [],
        },
        // labels are undefined until set by user
        contentLabels: {
          nsfw: temp__migrateLabelPref(
            res.contentLabels?.nsfw || DEFAULT_LABEL_PREFERENCES.nsfw,
          ),
          nudity: temp__migrateLabelPref(
            res.contentLabels?.nudity || DEFAULT_LABEL_PREFERENCES.nudity,
          ),
          suggestive: temp__migrateLabelPref(
            res.contentLabels?.suggestive ||
              DEFAULT_LABEL_PREFERENCES.suggestive,
          ),
          gore: temp__migrateLabelPref(
            res.contentLabels?.gore || DEFAULT_LABEL_PREFERENCES.gore,
          ),
          hate: temp__migrateLabelPref(
            res.contentLabels?.hate || DEFAULT_LABEL_PREFERENCES.hate,
          ),
          spam: temp__migrateLabelPref(
            res.contentLabels?.spam || DEFAULT_LABEL_PREFERENCES.spam,
          ),
          impersonation: temp__migrateLabelPref(
            res.contentLabels?.impersonation ||
              DEFAULT_LABEL_PREFERENCES.impersonation,
          ),
        },
        feedViewPrefs: {
          ...DEFAULT_HOME_FEED_PREFS,
          ...(res.feedViewPrefs.home || {}),
        },
        threadViewPrefs: {
          ...DEFAULT_THREAD_VIEW_PREFS,
          ...(res.threadViewPrefs ?? {}),
        },
        userAge: res.birthDate ? getAge(res.birthDate) : undefined,
      }
      return preferences
    },
  })
}

export function useModerationOpts() {
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const opts = useMemo(() => {
    if (!prefs.data) {
      return
    }
    return getModerationOpts({
      userDid: currentAccount?.did || '',
      preferences: prefs.data,
    })
  }, [currentAccount?.did, prefs.data])
  return opts
}

export function useClearPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await getAgent().app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {labelGroup: ConfigurableLabelGroup; visibility: LabelPreference}
  >({
    mutationFn: async ({labelGroup, visibility}) => {
      await getAgent().setContentLabelPref(labelGroup, visibility)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await getAgent().setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      await getAgent().setPersonalDetails({birthDate})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      await getAgent().setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await getAgent().setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetSaveFeedsMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    Pick<UsePreferencesQueryResponse['feeds'], 'saved' | 'pinned'>
  >({
    mutationFn: async ({saved, pinned}) => {
      await getAgent().setSavedFeeds(saved, pinned)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSaveFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().addSavedFeed(uri)
      track('CustomFeed:Save')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().removeSavedFeed(uri)
      track('CustomFeed:Unsave')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePinFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().addPinnedFeed(uri)
      track('CustomFeed:Pin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useUnpinFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().removePinnedFeed(uri)
      track('CustomFeed:Unpin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}
