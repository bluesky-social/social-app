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
import type * as AppBskyNotificationDefs from '#/lexicons/app/bsky/notification/defs'
import * as AppBskyNotificationGetPreferences from '#/lexicons/app/bsky/notification/getPreferences'
import * as AppBskyNotificationPutPreferencesV2 from '#/lexicons/app/bsky/notification/putPreferencesV2'
import type * as ChatBskyNotificationDefs from '#/lexicons/chat/bsky/notification/defs'
import * as ChatBskyNotificationGetPreferences from '#/lexicons/chat/bsky/notification/getPreferences'
import * as ChatBskyNotificationPutPreferences from '#/lexicons/chat/bsky/notification/putPreferences'

const RQKEY_ROOT = 'notification-settings'
const RQKEY_APP = [RQKEY_ROOT, 'app']
const RQKEY_CHAT = [RQKEY_ROOT, 'chat']

// App notification preferences live on the appview. Chat preferences live on a
// separate chat service proxy that can be up or down independently, so they are
// fetched and cached separately. This combined type names every preference for
// the generic settings dialog, but it is never the shape of a query response.
export type NotificationSettingsPreferences = Omit<
  AppBskyNotificationDefs.Preferences,
  'chat'
> &
  Partial<Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'>>

export type AppNotificationSettingsPreferences = Omit<
  AppBskyNotificationDefs.Preferences,
  'chat'
>

export type ChatNotificationSettingsPreferences = Pick<
  ChatBskyNotificationDefs.Preferences,
  'chat' | 'chatRequest'
>

export type NotificationSettingsPreferenceName = Exclude<
  keyof NotificationSettingsPreferences,
  '$type'
>

export type NotificationSettingsPreference =
  | AppBskyNotificationDefs.Preference
  | AppBskyNotificationDefs.FilterablePreference
  | ChatBskyNotificationDefs.ChatPreference

export function isChatPreferenceName(
  name: NotificationSettingsPreferenceName,
): name is 'chat' | 'chatRequest' {
  return name === 'chat' || name === 'chatRequest'
}

type NotificationSettingsUpdate = Partial<NotificationSettingsPreferences>

type AppNotificationSettingsUpdate = Partial<
  Omit<AppBskyNotificationDefs.Preferences, '$type' | 'chat'>
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
      const data = await client.call(AppBskyNotificationGetPreferences)
      return appPreferencesWithoutChat(data.preferences)
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
      const data = await client.call(ChatBskyNotificationGetPreferences)
      return chatPreferencesForSettings(data.preferences)
    },
    enabled,
  })
}
export function useNotificationSettingsUpdateMutation() {
  /*
   * App preferences live on the appview and chat preferences on the chat
   * service, so a combined update fans out over both clients.
   */
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: NotificationSettingsUpdate) => {
      const {appUpdate, chatUpdate} = splitNotificationSettingsUpdate(update)
      await Promise.all([
        hasUpdates(appUpdate)
          ? appviewClient.call(AppBskyNotificationPutPreferencesV2, appUpdate)
          : undefined,
        hasUpdates(chatUpdate)
          ? chatClient.call(ChatBskyNotificationPutPreferences, chatUpdate)
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
