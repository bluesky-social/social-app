import {useCallback} from 'react'
import {type DidString} from '@atproto/syntax'
import {
  addSavedFeeds,
  type BskyFeedViewPreference,
  dismissNudges,
  getPreferences,
  overwriteSavedFeeds,
  queueNudges,
  removeMutedWord,
  removeMutedWords,
  removeSavedFeeds,
  setActiveProgressGuide,
  setAdultContentEnabled,
  setContentLabelPref,
  setFeedViewPrefs,
  setIsBetaUser,
  setThreadViewPrefs,
  setVerificationPrefs,
  updateMutedWord,
  updateSavedFeeds,
  upsertMutedWords,
} from '@bsky.app/sdk'
import {type LabelPreference} from '@bsky.app/sdk/moderation'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {replaceEqualDeep} from '#/lib/functions'
import {getAge} from '#/lib/strings/time'
import {GCTIME, STALE} from '#/state/queries'
import {
  DEFAULT_HOME_FEED_PREFS,
  DEFAULT_LOGGED_OUT_PREFERENCES,
  DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const'
import {
  type ThreadViewPreferences,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient} from '#/state/session'
import {saveLabelers} from '#/state/session/agent-config'
import {useAgeAssurance} from '#/ageAssurance'
import {makeAgeRestrictedModerationPrefs} from '#/ageAssurance/util'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import {toLex} from '#/types/bsky'

export * from '#/state/queries/preferences/const'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/types'

export const preferencesQueryKey = createQueryKey(
  'getPreferences',
  {},
  {persistedVersion: 1},
)

export function usePreferencesQuery() {
  const client = usePdsClient()
  const aa = useAgeAssurance()

  const query = useQuery({
    staleTime: STALE.SECONDS.FIFTEEN,
    structuralSharing: replaceEqualDeep,
    refetchOnWindowFocus: true,
    queryKey: preferencesQueryKey,
    gcTime: GCTIME.INFINITY,
    queryFn: async () => {
      if (!client.did) {
        return DEFAULT_LOGGED_OUT_PREFERENCES
      } else {
        const res = await client.call(getPreferences)

        // save to local storage to ensure there are labels on initial requests
        void saveLabelers(
          client.did,
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
    select: useCallback(
      (data: UsePreferencesQueryResponse) => {
        /**
         * Prefs are all downstream of age assurance now. For logged-out
         * users, we override moderation prefs based on AA state.
         */
        if (
          aa.state.access !== aa.Access.Full ||
          aa.flags.adultContentDisabled
        ) {
          data = {
            ...data,
            /*
             * TODO(phase4): drop the toLex bridges once
             * `#/ageAssurance/util` (makeAgeRestrictedModerationPrefs) sources
             * `ModerationPrefs` from `@bsky.app/sdk/moderation` instead of
             * `@atproto/api`. The two shapes differ only in scalar branding
             * (e.g. MutedWord.actorTarget's UnknownString), so the values are
             * structurally interchangeable at this boundary.
             */
            moderationPrefs: toLex(
              makeAgeRestrictedModerationPrefs(toLex(data.moderationPrefs)),
            ),
          }
        }
        return data
      },
      [aa],
    ),
  })

  if (query.data?.birthDate) {
    /**
     * The persisted query cache stores dates as strings, but our code expects a `Date`.
     */
    query.data.birthDate = new Date(query.data.birthDate)
  }

  return query
}

export function useClearPreferencesMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      await client.call(app.bsky.actor.putPreferences, {preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const ax = useAnalytics()
  const client = usePdsClient()
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {label: string; visibility: LabelPreference; labelerDid: string | undefined}
  >({
    mutationFn: async ({label, visibility, labelerDid}) => {
      await client.call(setContentLabelPref, {
        key: label,
        value: visibility,
        labelerDid: labelerDid as DidString | undefined,
      })
      ax.metric('moderation:changeLabelPreference', {preference: visibility})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetContentLabelMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

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
      await client.call(setContentLabelPref, {
        key: label,
        value: visibility,
        labelerDid: labelerDid as DidString | undefined,
      })
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await client.call(setAdultContentEnabled, enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      /*
       * special handling here, merged into `feedViewPrefs` above, since
       * following was previously called `home`
       */
      await client.call(setFeedViewPrefs, {feed: 'home', ...prefs})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: void, variables: Partial<ThreadViewPreferences>) => void
  onError?: (error: unknown) => void
}) {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await client.call(setThreadViewPrefs, prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
    onSuccess,
    onError,
  })
}

export function useOverwriteSavedFeedsMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, app.bsky.actor.defs.SavedFeed[]>({
    mutationFn: async savedFeeds => {
      await client.call(overwriteSavedFeeds, savedFeeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useAddSavedFeedsMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<
    void,
    unknown,
    Pick<app.bsky.actor.defs.SavedFeed, 'type' | 'value' | 'pinned'>[]
  >({
    mutationFn: async savedFeeds => {
      await client.call(addSavedFeeds, savedFeeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, Pick<app.bsky.actor.defs.SavedFeed, 'id'>>({
    mutationFn: async savedFeed => {
      await client.call(removeSavedFeeds, [savedFeed.id])
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useReplaceForYouWithDiscoverFeedMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async ({
      forYouFeedConfig,
      discoverFeedConfig,
    }: {
      forYouFeedConfig: app.bsky.actor.defs.SavedFeed | undefined
      discoverFeedConfig: app.bsky.actor.defs.SavedFeed | undefined
    }) => {
      if (forYouFeedConfig) {
        await client.call(removeSavedFeeds, [forYouFeedConfig.id])
      }
      if (!discoverFeedConfig) {
        await client.call(addSavedFeeds, [
          {
            type: 'feed',
            value: PROD_DEFAULT_FEED('whats-hot'),
            pinned: true,
          },
        ])
      } else {
        await client.call(updateSavedFeeds, [
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
  const client = usePdsClient()

  return useMutation<void, unknown, app.bsky.actor.defs.SavedFeed[]>({
    mutationFn: async feeds => {
      await client.call(updateSavedFeeds, feeds)

      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpsertMutedWordsMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (mutedWords: app.bsky.actor.defs.MutedWord[]) => {
      await client.call(upsertMutedWords, mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateMutedWordMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (mutedWord: app.bsky.actor.defs.MutedWord) => {
      await client.call(updateMutedWord, mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (mutedWord: app.bsky.actor.defs.MutedWord) => {
      await client.call(removeMutedWord, mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordsMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (mutedWords: app.bsky.actor.defs.MutedWord[]) => {
      await client.call(removeMutedWords, mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useQueueNudgesMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (nudges: string | string[]) => {
      await client.call(queueNudges, Array.isArray(nudges) ? nudges : [nudges])
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useDismissNudgesMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (nudges: string | string[]) => {
      await client.call(
        dismissNudges,
        Array.isArray(nudges) ? nudges : [nudges],
      )
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetActiveProgressGuideMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (
      guide: app.bsky.actor.defs.BskyAppProgressGuide | undefined,
    ) => {
      await client.call(setActiveProgressGuide, guide)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetIsBetaUserMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async (isBetaUser: boolean) => {
      await client.call(setIsBetaUser, isBetaUser)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetVerificationPrefsMutation() {
  const ax = useAnalytics()
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation<void, unknown, app.bsky.actor.defs.VerificationPrefs>({
    mutationFn: async prefs => {
      await client.call(setVerificationPrefs, prefs)
      if (prefs.hideBadges) {
        ax.metric('verification:settings:hideBadges', {})
      } else {
        ax.metric('verification:settings:unHideBadges', {})
      }
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
