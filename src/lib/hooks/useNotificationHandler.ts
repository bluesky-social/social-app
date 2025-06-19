import {useEffect} from 'react'
import * as Notifications from 'expo-notifications'
import {type AppBskyNotificationListNotifications} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {CommonActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type NavigationProp} from '#/lib/routes/types'
import {Logger} from '#/logger'
import {isAndroid} from '#/platform/detection'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {RQKEY as RQKEY_NOTIFS} from '#/state/queries/notifications/feed'
import {invalidateCachedUnreadPage} from '#/state/queries/notifications/unread'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {resetToTab} from '#/Navigation'

export type NotificationReason =
  | 'like'
  | 'repost'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'chat-message'
  | 'starterpack-joined'
  | 'like-via-repost'
  | 'repost-via-repost'
  | 'verified'
  | 'unverified'

/**
 * Manually overridden type, but retains the possibility of
 * `notification.request.trigger.payload` being `undefined`, as specified in
 * the source types.
 */
type NotificationPayload =
  | undefined
  | {
      reason: Exclude<NotificationReason, 'chat-message'>
      uri: string
      subject: string
    }
  | {
      reason: 'chat-message'
      convoId: string
      messageId: string
      recipientDid: string
    }

const DEFAULT_HANDLER_OPTIONS = {
  shouldShowBanner: false,
  shouldShowList: false,
  shouldPlaySound: false,
  shouldSetBadge: true,
} satisfies Notifications.NotificationBehavior

// These need to stay outside the hook to persist between account switches
let storedPayload: NotificationPayload
let prevDate = 0

const logger = Logger.create(Logger.Context.Notifications)

export function useNotificationsHandler() {
  const queryClient = useQueryClient()
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const navigation = useNavigation<NavigationProp>()
  const {currentConvoId} = useCurrentConvoId()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {_} = useLingui()

  // On Android, we cannot control which sound is used for a notification on Android
  // 28 or higher. Instead, we have to configure a notification channel ahead of time
  // which has the sounds we want in the configuration for that channel. These two
  // channels allow for the mute/unmute functionality we want for the background
  // handler.
  useEffect(() => {
    if (!isAndroid) return
    // assign both chat notifications to a group
    // NOTE: I don't think that it will retroactively move them into the group
    // if the channels already exist. no big deal imo -sfn
    const CHAT_GROUP = 'chat'
    Notifications.setNotificationChannelGroupAsync(CHAT_GROUP, {
      name: _(msg`Chat`),
      description: _(
        msg`You can choose whether chat notifications have sound in the chat settings within the app`,
      ),
    })
    Notifications.setNotificationChannelAsync('chat-messages', {
      name: _(msg`Chat messages - sound`),
      groupId: CHAT_GROUP,
      importance: Notifications.AndroidImportance.MAX,
      sound: 'dm.mp3',
      showBadge: true,
      vibrationPattern: [250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    })
    Notifications.setNotificationChannelAsync('chat-messages-muted', {
      name: _(msg`Chat messages - silent`),
      groupId: CHAT_GROUP,
      importance: Notifications.AndroidImportance.MAX,
      sound: null,
      showBadge: true,
      vibrationPattern: [250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    })

    Notifications.setNotificationChannelAsync(
      'like' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Likes`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'repost' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'reply' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Replies`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'mention' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Mentions`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'quote' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Quotes`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'follow' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`New followers`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'like-via-repost' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Likes of your reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'repost-via-repost' satisfies AppBskyNotificationListNotifications.Notification['reason'],
      {
        name: _(msg`Reposts of your reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
  }, [_])

  useEffect(() => {
    const handleNotification = (payload?: NotificationPayload) => {
      if (!payload) return

      if (payload.reason === 'chat-message') {
        if (payload.recipientDid !== currentAccount?.did && !storedPayload) {
          storedPayload = payload
          closeAllActiveElements()

          const account = accounts.find(a => a.did === payload.recipientDid)
          if (account) {
            onPressSwitchAccount(account, 'Notification')
          } else {
            setShowLoggedOut(true)
          }
        } else {
          navigation.dispatch(state => {
            if (state.routes[0].name === 'Messages') {
              if (
                state.routes[state.routes.length - 1].name ===
                'MessagesConversation'
              ) {
                return CommonActions.reset({
                  ...state,
                  routes: [
                    ...state.routes.slice(0, state.routes.length - 1),
                    {
                      name: 'MessagesConversation',
                      params: {
                        conversation: payload.convoId,
                      },
                    },
                  ],
                })
              } else {
                return CommonActions.navigate('MessagesConversation', {
                  conversation: payload.convoId,
                })
              }
            } else {
              return CommonActions.navigate('MessagesTab', {
                screen: 'Messages',
                params: {
                  pushToConversation: payload.convoId,
                },
              })
            }
          })
        }
      } else {
        switch (payload.reason) {
          case 'like':
          case 'repost':
          case 'follow':
          case 'mention':
          case 'quote':
          case 'reply':
          case 'starterpack-joined':
          case 'like-via-repost':
          case 'repost-via-repost':
          case 'verified':
          case 'unverified':
            resetToTab('NotificationsTab')
            break
          // TODO implement these after we have an idea of how to handle each individual case
          // case 'follow':
          //   const uri = new AtUri(payload.uri)
          //   setTimeout(() => {
          //     // @ts-expect-error types are weird here
          //     navigation.navigate('HomeTab', {
          //       screen: 'Profile',
          //       params: {
          //         name: uri.host,
          //       },
          //     })
          //   }, 500)
          //   break
          // case 'mention':
          // case 'reply':
          //   const urip = new AtUri(payload.uri)
          //   setTimeout(() => {
          //     // @ts-expect-error types are weird here
          //     navigation.navigate('HomeTab', {
          //       screen: 'PostThread',
          //       params: {
          //         name: urip.host,
          //         rkey: urip.rkey,
          //       },
          //     })
          //   }, 500)
        }
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async e => {
        if (
          e.request.trigger == null ||
          typeof e.request.trigger !== 'object' ||
          !('type' in e.request.trigger) ||
          e.request.trigger.type !== 'push'
        ) {
          return DEFAULT_HANDLER_OPTIONS
        }

        logger.debug('Notifications: received', {e})

        const payload = e.request.trigger.payload as NotificationPayload

        if (!payload) {
          return DEFAULT_HANDLER_OPTIONS
        }

        if (
          payload.reason === 'chat-message' &&
          payload.recipientDid === currentAccount?.did
        ) {
          const shouldAlert = payload.convoId !== currentConvoId
          return {
            shouldShowList: shouldAlert,
            shouldShowBanner: shouldAlert,
            shouldPlaySound: false,
            shouldSetBadge: false,
          } satisfies Notifications.NotificationBehavior
        }

        // Any notification other than a chat message should invalidate the unread page
        invalidateCachedUnreadPage()
        return DEFAULT_HANDLER_OPTIONS
      },
    })

    const responseReceivedListener =
      Notifications.addNotificationResponseReceivedListener(e => {
        if (e.notification.date === prevDate) {
          return
        }
        prevDate = e.notification.date

        logger.debug('Notifications: response received', {
          actionIdentifier: e.actionIdentifier,
        })

        if (
          e.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
          e.notification.request.trigger != null &&
          typeof e.notification.request.trigger === 'object' &&
          'type' in e.notification.request.trigger &&
          e.notification.request.trigger.type === 'push'
        ) {
          const payload = e.notification.request.trigger
            .payload as NotificationPayload

          if (!payload) return

          logger.debug(
            'User pressed a notification, opening notifications tab',
            {},
          )
          logger.metric(
            'notifications:openApp',
            {reason: payload.reason},
            {statsig: false},
          )

          invalidateCachedUnreadPage()
          truncateAndInvalidate(queryClient, RQKEY_NOTIFS('all'))

          if (
            payload.reason === 'mention' ||
            payload.reason === 'quote' ||
            payload.reason === 'reply'
          ) {
            truncateAndInvalidate(queryClient, RQKEY_NOTIFS('mentions'))
          }

          logger.debug('Notifications: handleNotification', {
            content: e.notification.request.content,
            payload: e.notification.request.trigger.payload,
          })

          handleNotification(payload)
          Notifications.dismissAllNotificationsAsync()
        }
      })

    // Whenever there's a stored payload, that means we had to switch accounts before handling the notification.
    // Whenever currentAccount changes, we should try to handle it again.
    if (
      storedPayload?.reason === 'chat-message' &&
      currentAccount?.did === storedPayload.recipientDid
    ) {
      handleNotification(storedPayload)
      storedPayload = undefined
    }

    return () => {
      responseReceivedListener.remove()
    }
  }, [
    queryClient,
    currentAccount,
    currentConvoId,
    accounts,
    closeAllActiveElements,
    currentAccount?.did,
    navigation,
    onPressSwitchAccount,
    setShowLoggedOut,
  ])
}
