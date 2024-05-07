import {useEffect} from 'react'
import * as Notifications from 'expo-notifications'
import {QueryClient} from '@tanstack/react-query'
import EventEmitter from 'eventemitter3'

import {logger} from '#/logger'
import {track} from 'lib/analytics/analytics'
import {useAccountSwitcher} from 'lib/hooks/useAccountSwitcher'
import {logEvent} from 'lib/statsig/statsig'
import {RQKEY as RQKEY_NOTIFS} from 'state/queries/notifications/feed'
import {invalidateCachedUnreadPage} from 'state/queries/notifications/unread'
import {truncateAndInvalidate} from 'state/queries/util'
import {useSession} from 'state/session'
import {resetToTab} from '#/Navigation'

export const emitter = new EventEmitter()

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

export function useNotificationsListener(queryClient: QueryClient) {
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  // const navigation = useNavigation()

  useEffect(() => {
    //<editor-fold desc="update the currently visible conversation">
    let convoId: string | null = null
    const onSetChat = (_convoId: string | null) => {
      console.log(_convoId)
      convoId = _convoId
    }
    emitter.addListener('setChat', onSetChat)
    //</editor-fold>

    //<editor-fold desc="determine when to show notifications while app is foregrounded">
    Notifications.setNotificationHandler({
      handleNotification: async e => {
        if (e.request.trigger.type !== 'push') return DEFAULT_HANDLER_OPTIONS

        // TODO uncomment
        // logger.debug(
        //   'Notifications: received',
        //   {e},
        //   logger.DebugContext.notifications,
        // )

        const payload = e.request.trigger.payload as NotificationRecord
        if (
          payload.reason === 'chat-message' &&
          payload.recipientDid === currentAccount?.did &&
          convoId !== payload.convoId
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

    //<editor-fold desc="logic for pressed notifications">
    const handleNotification = (payload?: NotificationRecord) => {
      // Handle navigation for this push notification

      if (!payload) return

      if (payload.reason === 'chat-message') {
        if (payload.recipientDid !== currentAccount?.did) {
          const account = accounts.find(a => a.did === payload.recipientDid)
          if (account) {
            // TODO what goes in context?
            onPressSwitchAccount(account, 'SwitchAccount')
          } else {
            // navigation.navigate('MessagesConversation', {
            //   conversation: payload.convoId,
            // })
          }
        } else {
        }
      } else {
        resetToTab('NotificationsTab')
        switch (payload.reason) {
          case 'like':
            break
          case 'repost':
            break
          case 'follow':
            break
          case 'mention':
            break
          case 'reply':
            break
        }
      }
    }
    //</editor-fold>

    //<editor-fold desc="handle incoming notification that was pressed before app was launched">
    Notifications.getLastNotificationResponseAsync().then(res => {
      if (
        res?.notification == null ||
        res?.notification.request.trigger.type !== 'push'
      ) {
        return
      }
      handleNotification(
        res.notification.request.trigger.payload as NotificationRecord,
      )
    })
    //</editor-fold>

    //<editor-fold desc="handle incoming notifications while app is launched">
    const responseReceivedListener =
      Notifications.addNotificationResponseReceivedListener(e => {
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
          handleNotification(
            e.notification.request.trigger.payload as NotificationRecord,
          )
        }
      })
    //</editor-fold>

    return () => {
      emitter.removeListener('setChat', onSetChat)
      responseReceivedListener.remove()
    }
  }, [queryClient, currentAccount, accounts, onPressSwitchAccount])
}
