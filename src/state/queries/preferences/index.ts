import {useEffect, useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {
  LabelPreference,
  BskyFeedViewPreference,
  ModerationOpts,
} from '@atproto/api'
import isEqual from 'lodash.isequal'

import {track} from '#/lib/analytics/analytics'
import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
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
  const {agent, hasSession} = useSession()
  return useQuery({
    enabled: hasSession,
    staleTime: STALE.MINUTES.ONE,
    queryKey: usePreferencesQueryKey,
    queryFn: async () => {
      const res = await agent.getPreferences()
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
  const [opts, setOpts] = useState<ModerationOpts | undefined>()
  const prefs = usePreferencesQuery()
  useEffect(() => {
    if (!prefs.data) {
      return
    }
    // only update this hook when the moderation options change
    const newOpts = getModerationOpts({
      userDid: currentAccount?.did || '',
      preferences: prefs.data,
    })
    if (!isEqual(opts, newOpts)) {
      setOpts(newOpts)
    }
  }, [prefs.data, currentAccount, opts, setOpts])
  return opts
}

export function useClearPreferencesMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await agent.app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {labelGroup: ConfigurableLabelGroup; visibility: LabelPreference}
  >({
    mutationFn: async ({labelGroup, visibility}) => {
      await agent.setContentLabelPref(labelGroup, visibility)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await agent.setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      await agent.setPersonalDetails({birthDate})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      await agent.setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await agent.setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSetSaveFeedsMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    Pick<UsePreferencesQueryResponse['feeds'], 'saved' | 'pinned'>
  >({
    mutationFn: async ({saved, pinned}) => {
      await agent.setSavedFeeds(saved, pinned)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useSaveFeedMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.addSavedFeed(uri)
      track('CustomFeed:Save')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.removeSavedFeed(uri)
      track('CustomFeed:Unsave')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function usePinFeedMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.addPinnedFeed(uri)
      track('CustomFeed:Pin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}

export function useUnpinFeedMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await agent.removePinnedFeed(uri)
      track('CustomFeed:Unpin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: usePreferencesQueryKey,
      })
    },
  })
}
