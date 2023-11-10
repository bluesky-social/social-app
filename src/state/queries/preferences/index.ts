import {BskyPreferences} from '@atproto/api'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
import {DEFAULT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {
  LabelPreference,
  ConfigurableLabelGroup,
} from '#/state/queries/preferences/types'

export * from '#/state/queries/preferences/types'
export * from '#/state/queries/preferences/moderation'

const usePreferencesQueryKey = ['getPreferences']

export function usePreferencesQuery() {
  const {agent} = useSession()
  return useQuery({
    queryKey: usePreferencesQueryKey,
    queryFn: async () => {
      const res = await agent.getPreferences()
      const preferences: BskyPreferences & {
        userAge: number | undefined
      } = {
        ...res,
        // labels are undefined until set by user
        contentLabels: {
          nsfw: res.contentLabels?.nsfw || DEFAULT_LABEL_PREFERENCES.nsfw,
          nudity: res.contentLabels?.nudity || DEFAULT_LABEL_PREFERENCES.nudity,
          suggestive:
            res.contentLabels?.suggestive ||
            DEFAULT_LABEL_PREFERENCES.suggestive,
          gore: res.contentLabels?.gore || DEFAULT_LABEL_PREFERENCES.gore,
          hate: res.contentLabels?.hate || DEFAULT_LABEL_PREFERENCES.hate,
          spam: res.contentLabels?.spam || DEFAULT_LABEL_PREFERENCES.spam,
          impersonation:
            res.contentLabels?.impersonation ||
            DEFAULT_LABEL_PREFERENCES.impersonation,
        },
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
