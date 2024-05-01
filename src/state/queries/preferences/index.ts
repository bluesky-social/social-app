import {
  AppBskyActorDefs,
  BskyFeedViewPreference,
  LabelPreference,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {track} from '#/lib/analytics/analytics'
import {replaceEqualDeep} from '#/lib/functions'
import {getAge} from '#/lib/strings/time'
import {STALE} from '#/state/queries'
import {
  DEFAULT_HOME_FEED_PREFS,
  DEFAULT_LOGGED_OUT_PREFERENCES,
  DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const'
import {
  ThreadViewPreferences,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'
import {useAgent} from '#/state/session'
import {saveLabelers} from '#/state/session/agent-config'

export * from '#/state/queries/preferences/const'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/types'

const preferencesQueryKeyRoot = 'getPreferences'
export const preferencesQueryKey = [preferencesQueryKeyRoot]

export function usePreferencesQuery() {
  const {getAgent} = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.FIFTEEN,
    structuralSharing: replaceEqualDeep,
    refetchOnWindowFocus: true,
    queryKey: preferencesQueryKey,
    queryFn: async () => {
      const agent = getAgent()

      if (agent.session?.did === undefined) {
        return DEFAULT_LOGGED_OUT_PREFERENCES
      } else {
        const res = await agent.getPreferences()

        // save to local storage to ensure there are labels on initial requests
        saveLabelers(
          agent.session.did,
          res.moderationPrefs.labelers.map(l => l.did),
        )

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

export function useClearPreferencesMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async () => {
      await getAgent().app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const {getAgent} = useAgent()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {label: string; visibility: LabelPreference; labelerDid: string | undefined}
  >({
    mutationFn: async ({label, visibility, labelerDid}) => {
      await getAgent().setContentLabelPref(label, visibility, labelerDid)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetContentLabelMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async ({
      label,
      visibility,
      labelerDid,
    }: {
      label: string
      visibility: LabelPreference
      labelerDid?: string
    }) => {
      await getAgent().setContentLabelPref(label, visibility, labelerDid)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await getAgent().setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      await getAgent().setPersonalDetails({birthDate: birthDate.toISOString()})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      await getAgent().setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await getAgent().setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetSaveFeedsMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<
    void,
    unknown,
    Pick<UsePreferencesQueryResponse['feeds'], 'saved' | 'pinned'>
  >({
    mutationFn: async ({saved, pinned}) => {
      await getAgent().setSavedFeeds(saved, pinned)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSaveFeedMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().addSavedFeed(uri)
      track('CustomFeed:Save')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().removeSavedFeed(uri)
      track('CustomFeed:Unsave')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePinFeedMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().addPinnedFeed(uri)
      track('CustomFeed:Pin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUnpinFeedMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation<void, unknown, {uri: string}>({
    mutationFn: async ({uri}) => {
      await getAgent().removePinnedFeed(uri)
      track('CustomFeed:Unpin', {uri})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpsertMutedWordsMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
      await getAgent().upsertMutedWords(mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateMutedWordMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await getAgent().updateMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordMutation() {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await getAgent().removeMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
