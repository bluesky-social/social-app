import {type AppBskyNotificationDefs} from '@atproto/api'
import {t} from '@lingui/macro'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'

const RQKEY_ROOT = 'notification-settings'
const RQKEY = [RQKEY_ROOT]

export function useNotificationSettingsQuery() {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY,
    queryFn: async () => {
      const response = await agent.app.bsky.notification.getPreferences()
      return response.data.preferences
    },
  })
}
export function useNotificationSettingsUpdateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      update: Partial<AppBskyNotificationDefs.Preferences>,
    ) => {
      const response = await agent.app.bsky.notification.putPreferencesV2(
        update,
      )
      return response.data.preferences
    },
    onMutate: update => {
      optimisticUpdateNotificationSettings(queryClient, update)
    },
    onError: e => {
      logger.error('Could not update notification settings', {message: e})
      queryClient.invalidateQueries({queryKey: RQKEY})
      Toast.show(t`Could not update notification settings`, 'xmark')
    },
  })
}

function optimisticUpdateNotificationSettings(
  queryClient: QueryClient,
  update: Partial<AppBskyNotificationDefs.Preferences>,
) {
  queryClient.setQueryData(
    RQKEY,
    (old?: AppBskyNotificationDefs.Preferences) => {
      if (!old) return old
      return {...old, ...update}
    },
  )
}
