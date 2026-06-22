import {
  type AppBskyNotificationDefs,
  type ChatBskyNotificationDefs,
} from '@atproto/api'
import {t} from '@lingui/core/macro'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import * as Toast from '#/components/Toast'

const RQKEY_ROOT = 'notification-settings'
const RQKEY = [RQKEY_ROOT]

export type NotificationSettingsPreferences = Omit<
  AppBskyNotificationDefs.Preferences,
  'chat'
> &
  Partial<Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'>>

export type NotificationSettingsPreferenceName = Exclude<
  keyof NotificationSettingsPreferences,
  '$type'
>

export type NotificationSettingsPreference =
  | AppBskyNotificationDefs.Preference
  | AppBskyNotificationDefs.FilterablePreference
  | ChatBskyNotificationDefs.ChatPreference

type NotificationSettingsUpdate = Partial<NotificationSettingsPreferences>

type AppNotificationSettingsUpdate = Partial<
  Omit<AppBskyNotificationDefs.Preferences, '$type' | 'chat'>
>

type ChatNotificationSettingsUpdate = Partial<
  Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'>
>

export function useNotificationSettingsQuery({
  enabled,
}: {enabled?: boolean} = {}) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY,
    queryFn: async () => {
      const [appResponse, chatResult] = await Promise.all([
        agent.app.bsky.notification.getPreferences(),
        // The chat service is a separate proxy that can fail independently. If
        // it does, still return app preferences so the rest of the screen works.
        agent.chat.bsky.notification
          .getPreferences(undefined, {headers: DM_SERVICE_HEADERS})
          .then(res => res.data.preferences)
          .catch(e => {
            logger.warn('Could not load chat notification settings', {
              safeMessage: e,
            })
            return undefined
          }),
      ])

      return mergeNotificationSettingsPreferences(
        appResponse.data.preferences,
        chatResult,
      )
    },
    enabled,
  })
}
export function useNotificationSettingsUpdateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: NotificationSettingsUpdate) => {
      const {appUpdate, chatUpdate} = splitNotificationSettingsUpdate(update)
      await Promise.all([
        hasUpdates(appUpdate)
          ? agent.app.bsky.notification.putPreferencesV2(appUpdate)
          : undefined,
        hasUpdates(chatUpdate)
          ? agent.chat.bsky.notification.putPreferences(chatUpdate, {
              headers: DM_SERVICE_HEADERS,
              encoding: 'application/json',
            })
          : undefined,
      ])
    },
    onMutate: update => {
      optimisticUpdateNotificationSettings(queryClient, update)
    },
    onError: e => {
      logger.error('Could not update notification settings', {message: e})
      void queryClient.invalidateQueries({queryKey: RQKEY})
      Toast.show(t`Could not update notification settings`, {
        type: 'error',
      })
    },
  })
}

function optimisticUpdateNotificationSettings(
  queryClient: QueryClient,
  update: NotificationSettingsUpdate,
) {
  queryClient.setQueryData(RQKEY, (old?: NotificationSettingsPreferences) => {
    if (!old) return old
    return {...old, ...update}
  })
}

function mergeNotificationSettingsPreferences(
  appPreferences: AppBskyNotificationDefs.Preferences,
  chatPreferences?: ChatBskyNotificationDefs.Preferences,
): NotificationSettingsPreferences {
  return {
    ...appPreferencesWithoutChat(appPreferences),
    ...(chatPreferences ? chatPreferencesForSettings(chatPreferences) : {}),
  }
}

function appPreferencesWithoutChat(
  preferences: AppBskyNotificationDefs.Preferences,
): Omit<AppBskyNotificationDefs.Preferences, 'chat'> {
  const {chat: _ignoredChat, ...appPreferences} = preferences
  return appPreferences
}

function chatPreferencesForSettings(
  preferences: ChatBskyNotificationDefs.Preferences,
): Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'> {
  return {
    chat: preferences.chat,
    chatRequest: preferences.chatRequest,
  }
}

function splitNotificationSettingsUpdate(update: NotificationSettingsUpdate): {
  appUpdate: AppNotificationSettingsUpdate
  chatUpdate: ChatNotificationSettingsUpdate
} {
  const {chat, chatRequest, $type: _type, ...appUpdate} = update

  return {
    appUpdate: appUpdate,
    chatUpdate: {
      ...(chat !== undefined ? {chat} : {}),
      ...(chatRequest !== undefined ? {chatRequest} : {}),
    },
  }
}

function hasUpdates(update: object) {
  return Object.keys(update).length > 0
}
