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
  DEFAULT_PREFERENCES,
} from '#/state/queries/preferences/const'
import {getModerationOpts} from '#/state/queries/preferences/moderation'
import {STALE} from '#/state/queries'

export * from '#/state/queries/preferences/types'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/const'

const DEFAULT_USER_DID = 'noUser'

export const preferencesQueryKey = (did = DEFAULT_USER_DID) => [
  'getPreferences',
  did,
]

export function usePreferencesQuery() {
  const {currentAccount} = useSession()
  return useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: preferencesQueryKey(currentAccount?.did),
    queryFn: async () => {
      if (currentAccount?.did === undefined) {
        return DEFAULT_PREFERENCES
      } else {
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
      }
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
      const agent = getAgent()
      await agent.app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
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
      const agent = getAgent()
      await agent.setContentLabelPref(labelGroup, visibility)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      const agent = getAgent()
      await agent.setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      const agent = getAgent()
      await agent.setPersonalDetails({birthDate})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      const agent = getAgent()
      await agent.setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      const agent = getAgent()
      await agent.setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
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
      const agent = getAgent()
      await agent.setSavedFeeds(saved, pinned)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function useSaveFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      const agent = getAgent()
      await agent.addSavedFeed(uri)
      track('CustomFeed:Save')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      const agent = getAgent()
      await agent.removeSavedFeed(uri)
      track('CustomFeed:Unsave')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function usePinFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      const agent = getAgent()
      await agent.addPinnedFeed(uri)
      track('CustomFeed:Pin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}

export function useUnpinFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      const agent = getAgent()
      await agent.removePinnedFeed(uri)
      track('CustomFeed:Unpin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey(agent.session?.did),
      })
    },
  })
}
