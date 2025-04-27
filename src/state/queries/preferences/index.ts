import {
  type AppBskyActorDefs,
  type BskyFeedViewPreference,
  type LabelPreference,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {replaceEqualDeep} from '#/lib/functions'
import {getAge} from '#/lib/strings/time'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {
  DEFAULT_HOME_FEED_PREFS,
  DEFAULT_LOGGED_OUT_PREFERENCES,
  DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const'
import {
  type ThreadViewPreferences,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'
import {useAgent} from '#/state/session'
import {saveLabelers} from '#/state/session/agent-config'

export * from '#/state/queries/preferences/const'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/types'

const preferencesQueryKeyRoot = 'getPreferences'
export const preferencesQueryKey = [preferencesQueryKeyRoot]

export function usePreferencesQuery() {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.FIFTEEN,
    structuralSharing: replaceEqualDeep,
    refetchOnWindowFocus: true,
    queryKey: preferencesQueryKey,
    queryFn: async () => {
      if (!agent.did) {
        return DEFAULT_LOGGED_OUT_PREFERENCES
      } else {
        const res = await agent.getPreferences()

        // save to local storage to ensure there are labels on initial requests
        saveLabelers(
          agent.did,
          res.moderationPrefs.labelers.map(l => l.did),
        )

        const preferences: UsePreferencesQueryResponse = {
          ...res,
          savedFeeds: res.savedFeeds.filter(f => f.type !== 'unknown'),
          /**
           * Special preference, only used for following feed, previously
           * called `home`
           */
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
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      await agent.app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {label: string; visibility: LabelPreference; labelerDid: string | undefined}
  >({
    mutationFn: async ({label, visibility, labelerDid}) => {
      await agent.setContentLabelPref(label, visibility, labelerDid)
      logger.metric(
        'moderation:changeLabelPreference',
        {preference: visibility},
        {statsig: true},
      )
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetContentLabelMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

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
      await agent.setContentLabelPref(label, visibility, labelerDid)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await agent.setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      await agent.setPersonalDetails({birthDate: birthDate.toISOString()})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      /*
       * special handling here, merged into `feedViewPrefs` above, since
       * following was previously called `home`
       */
      await agent.setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await agent.setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useOverwriteSavedFeedsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
    mutationFn: async savedFeeds => {
      await agent.overwriteSavedFeeds(savedFeeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useAddSavedFeedsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<
    void,
    unknown,
    Pick<AppBskyActorDefs.SavedFeed, 'type' | 'value' | 'pinned'>[]
  >({
    mutationFn: async savedFeeds => {
      await agent.addSavedFeeds(savedFeeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, Pick<AppBskyActorDefs.SavedFeed, 'id'>>({
    mutationFn: async savedFeed => {
      await agent.removeSavedFeeds([savedFeed.id])
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useReplaceForYouWithDiscoverFeedMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      forYouFeedConfig,
      discoverFeedConfig,
    }: {
      forYouFeedConfig: AppBskyActorDefs.SavedFeed | undefined
      discoverFeedConfig: AppBskyActorDefs.SavedFeed | undefined
    }) => {
      if (forYouFeedConfig) {
        await agent.removeSavedFeeds([forYouFeedConfig.id])
      }
      if (!discoverFeedConfig) {
        await agent.addSavedFeeds([
          {
            type: 'feed',
            value: PROD_DEFAULT_FEED('whats-hot'),
            pinned: true,
          },
        ])
      } else {
        await agent.updateSavedFeeds([
          {
            ...discoverFeedConfig,
            pinned: true,
          },
        ])
      }
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateSavedFeedsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
    mutationFn: async feeds => {
      await agent.updateSavedFeeds(feeds)

      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpsertMutedWordsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
      await agent.upsertMutedWords(mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateMutedWordMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await agent.updateMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await agent.removeMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
      await agent.removeMutedWords(mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useQueueNudgesMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (nudges: string | string[]) => {
      await agent.bskyAppQueueNudges(nudges)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useDismissNudgesMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (nudges: string | string[]) => {
      await agent.bskyAppDismissNudges(nudges)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetActiveProgressGuideMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (
      guide: AppBskyActorDefs.BskyAppProgressGuide | undefined,
    ) => {
      await agent.bskyAppSetActiveProgressGuide(guide)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetVerificationPrefsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<void, unknown, AppBskyActorDefs.VerificationPrefs>({
    mutationFn: async prefs => {
      await agent.setVerificationPrefs(prefs)
      if (prefs.hideBadges) {
        logger.metric('verification:settings:hideBadges', {})
      } else {
        logger.metric('verification:settings:unHideBadges', {})
      }
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
