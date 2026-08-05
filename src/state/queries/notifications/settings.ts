import {t} from '@lingui/core/macro'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAppviewClient, useChatClient} from '#/state/session'
import * as Toast from '#/components/Toast'
import {app, chat} from '#/lexicons'

const RQKEY_ROOT = 'notification-settings'
const RQKEY_APP = [RQKEY_ROOT, 'app']
const RQKEY_CHAT = [RQKEY_ROOT, 'chat']

// App notification preferences live on the appview. Chat preferences live on a
// separate chat service proxy that can be up or down independently, so they are
// fetched and cached separately. This combined type names every preference for
// the generic settings dialog, but it is never the shape of a query response.
export type NotificationSettingsPreferences = Omit<
  app.bsky.notification.defs.Preferences,
  'chat'
> &
  Partial<Pick<chat.bsky.notification.defs.Preferences, 'chat' | 'chatRequest'>>

export type AppNotificationSettingsPreferences = Omit<
  app.bsky.notification.defs.Preferences,
  'chat'
>

export type ChatNotificationSettingsPreferences = Pick<
  chat.bsky.notification.defs.Preferences,
  'chat' | 'chatRequest'
>

export type NotificationSettingsPreferenceName = Exclude<
  keyof NotificationSettingsPreferences,
  '$type'
>

export type NotificationSettingsPreference =
  | app.bsky.notification.defs.Preference
  | app.bsky.notification.defs.FilterablePreference
  | chat.bsky.notification.defs.ChatPreference

export function isChatPreferenceName(
  name: NotificationSettingsPreferenceName,
): name is 'chat' | 'chatRequest' {
  return name === 'chat' || name === 'chatRequest'
}

type NotificationSettingsUpdate = Partial<NotificationSettingsPreferences>

type AppNotificationSettingsUpdate = Partial<
  Omit<app.bsky.notification.defs.Preferences, '$type' | 'chat'>
>

type ChatNotificationSettingsUpdate =
  Partial<ChatNotificationSettingsPreferences>

export function useNotificationSettingsQuery({
  enabled,
}: {enabled?: boolean} = {}) {
  const client = useAppviewClient()

  return useQuery({
    queryKey: RQKEY_APP,
    queryFn: async (): Promise<AppNotificationSettingsPreferences> => {
      const res = await client.call(app.bsky.notification.getPreferences)
      return appPreferencesWithoutChat(res.preferences)
    },
    enabled,
  })
}

export function useChatNotificationSettingsQuery({
  enabled,
}: {enabled?: boolean} = {}) {
  const client = useChatClient()

  return useQuery({
    queryKey: RQKEY_CHAT,
    queryFn: async (): Promise<ChatNotificationSettingsPreferences> => {
      const res = await client.call(chat.bsky.notification.getPreferences)
      return chatPreferencesForSettings(res.preferences)
    },
    enabled,
  })
}
export function useNotificationSettingsUpdateMutation() {
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: NotificationSettingsUpdate) => {
      const {appUpdate, chatUpdate} = splitNotificationSettingsUpdate(update)
      await Promise.all([
        hasUpdates(appUpdate)
          ? appviewClient.call(
              app.bsky.notification.putPreferencesV2,
              appUpdate,
            )
          : undefined,
        hasUpdates(chatUpdate)
          ? chatClient.call(chat.bsky.notification.putPreferences, chatUpdate)
          : undefined,
      ])
    },
    onMutate: update => {
      optimisticUpdateNotificationSettings(queryClient, update)
    },
    onError: e => {
      logger.error('Could not update notification settings', {message: e})
      void queryClient.invalidateQueries({queryKey: RQKEY_APP})
      void queryClient.invalidateQueries({queryKey: RQKEY_CHAT})
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
  const {appUpdate, chatUpdate} = splitNotificationSettingsUpdate(update)

  if (hasUpdates(appUpdate)) {
    queryClient.setQueryData(
      RQKEY_APP,
      (old?: AppNotificationSettingsPreferences) => {
        if (!old) return old
        return {...old, ...appUpdate}
      },
    )
  }

  if (hasUpdates(chatUpdate)) {
    queryClient.setQueryData(
      RQKEY_CHAT,
      (old?: ChatNotificationSettingsPreferences) => {
        if (!old) return old
        return {...old, ...chatUpdate}
      },
    )
  }
}

function appPreferencesWithoutChat(
  preferences: app.bsky.notification.defs.Preferences,
): Omit<app.bsky.notification.defs.Preferences, 'chat'> {
  const {chat: _ignoredChat, ...appPreferences} = preferences
  return appPreferences
}

function chatPreferencesForSettings(
  preferences: chat.bsky.notification.defs.Preferences,
): Pick<chat.bsky.notification.defs.Preferences, 'chat' | 'chatRequest'> {
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
