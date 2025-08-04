import {useEffect} from 'react'
import * as Notifications from 'expo-notifications'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {CommonActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {logger as notyLogger} from '#/lib/notifications/util'
import {type NavigationProp} from '#/lib/routes/types'
import {isAndroid, isIOS} from '#/platform/detection'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {RQKEY as RQKEY_NOTIFS} from '#/state/queries/notifications/feed'
import {invalidateCachedUnreadPage} from '#/state/queries/notifications/unread'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {resetToTab} from '#/Navigation'
import {router} from '#/routes'

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
  | 'subscribed-post'

/**
 * Manually overridden type, but retains the possibility of
 * `notification.request.trigger.payload` being `undefined`, as specified in
 * the source types.
 */
export type NotificationPayload =
  | undefined
  | {
      reason: Exclude<NotificationReason, 'chat-message'>
      uri: string
      subject: string
      recipientDid: string
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

/**
 * Cached notification payload if we handled a notification while the user was
 * using a different account. This is consumed after we finish switching
 * accounts.
 */
let storedAccountSwitchPayload: NotificationPayload

/**
 * Used to ensure we don't handle the same notification twice
 */
let lastHandledNotificationDateDedupe = 0

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
      'like' satisfies NotificationReason,
      {
        name: _(msg`Likes`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'repost' satisfies NotificationReason,
      {
        name: _(msg`Reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'reply' satisfies NotificationReason,
      {
        name: _(msg`Replies`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'mention' satisfies NotificationReason,
      {
        name: _(msg`Mentions`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'quote' satisfies NotificationReason,
      {
        name: _(msg`Quotes`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'follow' satisfies NotificationReason,
      {
        name: _(msg`New followers`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'like-via-repost' satisfies NotificationReason,
      {
        name: _(msg`Likes of your reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'repost-via-repost' satisfies NotificationReason,
      {
        name: _(msg`Reposts of your reposts`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
    Notifications.setNotificationChannelAsync(
      'subscribed-post' satisfies NotificationReason,
      {
        name: _(msg`Activity from others`),
        importance: Notifications.AndroidImportance.HIGH,
      },
    )
  }, [_])

  useEffect(() => {
    const handleNotification = (payload?: NotificationPayload) => {
      if (!payload) return

      if (payload.reason === 'chat-message') {
        notyLogger.debug(`useNotificationsHandler: handling chat message`, {
          payload,
        })

        if (
          payload.recipientDid !== currentAccount?.did &&
          !storedAccountSwitchPayload
        ) {
          storePayloadForAccountSwitch(payload)
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
        const url = notificationToURL(payload)

        if (url === '/notifications') {
          resetToTab('NotificationsTab')
        } else if (url) {
          const [screen, params] = router.matchPath(url)
          // @ts-expect-error router is not typed :/ -sfn
          navigation.navigate('HomeTab', {screen, params})
          notyLogger.debug(`useNotificationsHandler: navigate`, {
            screen,
            params,
          })
        }
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async e => {
        const payload = getNotificationPayload(e)

        if (!payload) return DEFAULT_HANDLER_OPTIONS

        notyLogger.debug('useNotificationsHandler: incoming', {e, payload})

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
        if (e.notification.date === lastHandledNotificationDateDedupe) return
        lastHandledNotificationDateDedupe = e.notification.date

        notyLogger.debug('useNotificationsHandler: response received', {
          actionIdentifier: e.actionIdentifier,
        })

        if (e.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
          return
        }

        const payload = getNotificationPayload(e.notification)

        if (payload) {
          if (!payload.reason) {
            notyLogger.error(
              'useNotificationsHandler: received unknown payload',
              {
                payload,
                identifier: e.notification.request.identifier,
              },
            )
            return
          }

          notyLogger.debug(
            'User pressed a notification, opening notifications tab',
            {},
          )
          notyLogger.metric(
            'notifications:openApp',
            {reason: payload.reason, causedBoot: false},
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

          notyLogger.debug('Notifications: handleNotification', {
            content: e.notification.request.content,
            payload: payload,
          })

          handleNotification(payload)
          Notifications.dismissAllNotificationsAsync()
        } else {
          notyLogger.error('useNotificationsHandler: received no payload', {
            identifier: e.notification.request.identifier,
          })
        }
      })

    // Whenever there's a stored payload, that means we had to switch accounts before handling the notification.
    // Whenever currentAccount changes, we should try to handle it again.
    if (
      storedAccountSwitchPayload?.reason === 'chat-message' &&
      currentAccount?.did === storedAccountSwitchPayload.recipientDid
    ) {
      handleNotification(storedAccountSwitchPayload)
      storedAccountSwitchPayload = undefined
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

export function storePayloadForAccountSwitch(payload: NotificationPayload) {
  storedAccountSwitchPayload = payload
}

export function getNotificationPayload(
  e: Notifications.Notification,
): NotificationPayload | null {
  if (
    e.request.trigger == null ||
    typeof e.request.trigger !== 'object' ||
    !('type' in e.request.trigger) ||
    e.request.trigger.type !== 'push'
  ) {
    return null
  }

  const payload = (
    isIOS ? e.request.trigger.payload : e.request.content.data
  ) as NotificationPayload

  if (payload) {
    return payload
  } else {
    return null
  }
}

export function notificationToURL(payload: NotificationPayload): string | null {
  switch (payload?.reason) {
    case 'like':
    case 'repost':
    case 'like-via-repost':
    case 'repost-via-repost': {
      const urip = new AtUri(payload.subject)
      if (urip.collection === 'app.bsky.feed.post') {
        return `/profile/${urip.host}/post/${urip.rkey}`
      } else {
        return '/notifications'
      }
    }
    case 'reply':
    case 'quote':
    case 'mention':
    case 'subscribed-post': {
      const urip = new AtUri(payload.uri)
      if (urip.collection === 'app.bsky.feed.post') {
        return `/profile/${urip.host}/post/${urip.rkey}`
      } else {
        return '/notifications'
      }
    }
    case 'follow':
    case 'starterpack-joined': {
      const urip = new AtUri(payload.uri)
      return `/profile/${urip.host}`
    }
    case 'chat-message':
      // should be handled separately
      return null
    case 'verified':
    case 'unverified':
      return '/notifications'
    default:
      // do nothing if we don't know what to do with it
      return null
  }
}
