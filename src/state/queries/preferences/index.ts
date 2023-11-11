import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {LabelPreference, BskyFeedViewPreference} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
import {DEFAULT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {
  ConfigurableLabelGroup,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'
import {temp__migrateLabelPref} from '#/state/queries/preferences/util'
import {DEFAULT_HOME_FEED_PREFS} from '#/state/queries/preferences/const'

export * from '#/state/queries/preferences/types'
export * from '#/state/queries/preferences/moderation'

const usePreferencesQueryKey = ['getPreferences']

export function usePreferencesQuery() {
  const {agent} = useSession()
  return useQuery({
    queryKey: usePreferencesQueryKey,
    queryFn: async () => {
      const res = await agent.getPreferences()
      const preferences: UsePreferencesQueryResponse = {
        ...res,
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
        homeFeed: res.feedViewPrefs.home ?? DEFAULT_HOME_FEED_PREFS,
        userAge: res.birthDate ? getAge(res.birthDate) : undefined,
      }
      return preferences
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
