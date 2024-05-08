import {useEffect, useRef} from 'react'
import * as Notifications from 'expo-notifications'
import {AtUri} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {QueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {track} from 'lib/analytics/analytics'
import {useAccountSwitcher} from 'lib/hooks/useAccountSwitcher'
import {NavigationProp} from 'lib/routes/types'
import {logEvent} from 'lib/statsig/statsig'
import {useCurrentConvoId} from 'state/messages/current-convo-id'
import {RQKEY as RQKEY_NOTIFS} from 'state/queries/notifications/feed'
import {invalidateCachedUnreadPage} from 'state/queries/notifications/unread'
import {truncateAndInvalidate} from 'state/queries/util'
import {useSession} from 'state/session'
import {useLoggedOutViewControls} from 'state/shell/logged-out'
import {useCloseAllActiveElements} from 'state/util'
import {resetToTab} from '#/Navigation'

type NotificationReason =
  | 'like'
  | 'repost'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'chat-message'

type NotificationRecord =
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
  shouldShowAlert: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
}

let storedPayload: NotificationRecord | undefined

export function useNotificationsListener(queryClient: QueryClient) {
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const navigation = useNavigation<NavigationProp>()
  const {currentConvoId: currentConvoIdFromState} = useCurrentConvoId()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const currentConvoId = useRef<string | undefined>(currentConvoIdFromState)
  const handleNotification = useRef<(payload?: NotificationRecord) => void>()

  useEffect(() => {
    currentConvoId.current = currentConvoIdFromState
  }, [currentConvoIdFromState])

  useEffect(() => {
    handleNotification.current = (payload?: NotificationRecord) => {
      if (!payload) return

      if (payload.reason === 'chat-message') {
        if (payload.recipientDid !== currentAccount?.did) {
          storedPayload = payload
          const account = accounts.find(a => a.did === payload.recipientDid)
          if (account) {
            // TODO what goes in context?
            onPressSwitchAccount(account, 'SwitchAccount')
          } else {
            closeAllActiveElements()
            setShowLoggedOut(true)
          }
        } else {
          setTimeout(() => {
            // @ts-expect-error types are weird here
            navigation.navigate('MessagesTab', {
              screen: 'MessagesConversation',
              params: {
                conversation: payload.convoId,
              },
            })
          }, 500)
        }
      } else {
        switch (payload.reason) {
          case 'like':
          case 'repost':
            resetToTab('NotificationsTab')
          case 'follow':
            const uri = new AtUri(payload.uri)
            setTimeout(() => {
              // @ts-expect-error types are weird here
              navigation.navigate('HomeTab', {
                screen: 'Profile',
                params: {
                  name: uri.host,
                },
              })
            }, 500)
            break
          case 'mention':
          case 'reply':
            const urip = new AtUri(payload.uri)
            setTimeout(() => {
              // @ts-expect-error types are weird here
              navigation.navigate('HomeTab', {
                screen: 'PostThread',
                params: {
                  name: urip.host,
                  rkey: urip.rkey,
                },
              })
            }, 500)
            break
        }
      }
    }
  }, [
    accounts,
    closeAllActiveElements,
    currentAccount?.did,
    navigation,
    onPressSwitchAccount,
    setShowLoggedOut,
  ])

  useEffect(() => {
    //<editor-fold desc="determine when to show notifications while app is foregrounded">
    Notifications.setNotificationHandler({
      handleNotification: async e => {
        if (e.request.trigger.type !== 'push') return DEFAULT_HANDLER_OPTIONS

        logger.debug(
          'Notifications: received',
          {e},
          logger.DebugContext.notifications,
        )

        const payload = e.request.trigger.payload as NotificationRecord
        if (
          payload.reason === 'chat-message' &&
          payload.recipientDid === currentAccount?.did &&
          currentConvoId.current !== payload.convoId
        ) {
          return {
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }
        } else {
          invalidateCachedUnreadPage()
        }

        return DEFAULT_HANDLER_OPTIONS
      },
    })
    //</editor-fold>

    //<editor-fold desc="handle incoming notifications while app is launched">
    const responseReceivedListener =
      Notifications.addNotificationResponseReceivedListener(e => {
        console.log(e)
        logger.debug(
          'Notifications: response received',
          {
            actionIdentifier: e.actionIdentifier,
          },
          logger.DebugContext.notifications,
        )
        if (
          e.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
          e.notification.request.trigger.type === 'push'
        ) {
          logger.debug(
            'User pressed a notification, opening notifications tab',
            {},
            logger.DebugContext.notifications,
          )
          track('Notificatons:OpenApp')
          logEvent('notifications:openApp', {})
          invalidateCachedUnreadPage()
          truncateAndInvalidate(queryClient, RQKEY_NOTIFS())
          logger.debug('Notifications: handleNotification', {
            content: e.notification.request.content,
            payload: e.notification.request.trigger.payload,
          })
          handleNotification.current?.(
            e.notification.request.trigger.payload as NotificationRecord,
          )
          Notifications.dismissAllNotificationsAsync()
        }
      })
    // </editor-fold>

    if (
      storedPayload &&
      currentAccount &&
      storedPayload.reason === 'chat-message' &&
      currentAccount.did === storedPayload.recipientDid
    ) {
      setTimeout(() => {
        handleNotification.current?.(storedPayload)
        storedPayload = undefined
      }, 1000)
    }

    return () => {
      responseReceivedListener.remove()
    }
  }, [queryClient, currentAccount])
}
