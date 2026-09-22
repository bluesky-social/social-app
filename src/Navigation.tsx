import {useEffect, useRef} from 'react'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useRootNavigationState,
} from 'expo-router'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type ChatNotificationPayload,
  getNotificationPayload,
  isChatNotificationPayload,
  notificationToURL,
  storePayloadForAccountSwitch,
} from '#/lib/hooks/useNotificationHandler'
import {
  navigate,
  reset,
  resetToTab,
  toAppState,
  useAppNavigationRef,
} from '#/lib/navigation'
import {useCallOnce} from '#/lib/once'
import {getCurrentRoute} from '#/lib/routes/helpers'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {
  shouldRequestEmailConfirmation,
  snoozeEmailConfirmationPrompt,
} from '#/state/shell/reminders'
import {useCloseAllActiveElements} from '#/state/util'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {useAnalytics} from '#/analytics'
import {setNavigationMetadata} from '#/analytics/metadata'
import {IS_NATIVE, IS_WEB} from '#/env'
import {router} from '#/routes'
import {Referrer} from '../modules/expo-bluesky-swiss-army'

let didHandlePushNotificationEntry = false
let previousAccountDid: string | undefined

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  const ax = useAnalytics()
  const navigationRef = useAppNavigationRef()
  const state = useRootNavigationState()
  const previousState = useRef<typeof state | undefined>(undefined)
  const getCurrentRouteName = () =>
    state ? getCurrentRoute(toAppState(state)).name : undefined
  // eslint-disable-next-line react-compiler/react-compiler
  const notyLogger = ax.logger.useChild(ax.logger.Context.Notifications)
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  const {currentAccount, accounts} = useSession()
  useEffect(() => {
    if (previousAccountDid && previousAccountDid !== currentAccount?.did) {
      void reset()
    }
    previousAccountDid = currentAccount?.did
  }, [currentAccount?.did])
  const {onPressSwitchAccount} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const previousScreen = useRef<string | undefined>(undefined)
  const emailDialogControl = useEmailDialogControl()
  const closeAllActiveElements = useCloseAllActiveElements()
  const linkingUrl = Linking.useLinkingURL()

  /**
   * Handle navigation to the messages tab, or prepares for account switch.
   *
   * Non-reactive because we need the latest data from some hooks
   * after an async call - sfn
   */
  const handleChatNotification = useNonReactiveCallback(
    (payload: ChatNotificationPayload) => {
      notyLogger.debug(`handleChatNotification`, {payload})

      if (payload.recipientDid !== currentAccount?.did) {
        // handled in useNotificationHandler after account switch finishes
        storePayloadForAccountSwitch(payload)
        closeAllActiveElements()

        const account = accounts.find(a => a.did === payload.recipientDid)
        if (account) {
          void onPressSwitchAccount(account, 'Notification')
        } else {
          setShowLoggedOut(true)
        }
      } else if (
        payload.reason === 'chat-message' ||
        payload.reason === 'chat-reaction' ||
        payload.reason === 'chat-added-to-group'
      ) {
        // chat-added-to-group routes to the convo because the recipient was
        // just added and now has access.
        void navigate('MessagesTab', {
          screen: 'Messages',
          params: {
            pushToConversation: payload.convoId,
          },
        })
      } else {
        // chat-removed-from-group, chat-join-request-rejected: the convo is
        // no longer accessible to the recipient, so just open the list.
        void navigate('MessagesTab', {screen: 'Messages'})
      }
    },
  )

  function handlePushNotificationEntry() {
    if (!IS_NATIVE) return

    // Only consume a launching notification once per JS runtime. Account
    // switches remount the entire tree (see `key={currentAccount?.did}` in
    // `App.native.tsx`), which re-fires `onNavigationReady` and would
    // otherwise re-process whatever `getLastNotificationResponse` still has
    // cached natively (APP-2338).
    if (didHandlePushNotificationEntry) return
    didHandlePushNotificationEntry = true

    // intent urls are handled by `useIntentHandler`
    if (linkingUrl) return

    const notificationResponse = Notifications.getLastNotificationResponse()

    if (notificationResponse) {
      notyLogger.debug(`handlePushNotificationEntry: response`, {
        response: notificationResponse,
      })

      // Clear the last notification response to ensure it's not used again
      try {
        Notifications.clearLastNotificationResponse()
      } catch (error) {
        notyLogger.error(
          `handlePushNotificationEntry: error clearing notification response`,
          {error},
        )
      }

      const payload = getNotificationPayload(notificationResponse.notification)

      if (payload) {
        ax.metric('notifications:openApp', {
          reason: payload.reason,
          causedBoot: true,
        })

        if (isChatNotificationPayload(payload)) {
          handleChatNotification(payload)
        } else {
          const path = notificationToURL(payload)

          if (path === '/notifications') {
            resetToTab('NotificationsTab')
            notyLogger.debug(`handlePushNotificationEntry: default navigate`)
          } else if (path) {
            const [screen, params] = router.matchPath(path)
            void navigate('HomeTab', {screen, params})
            notyLogger.debug(`handlePushNotificationEntry: navigate`, {
              screen,
              params,
            })
          }
        }
      }
    }
  }

  const onNavigationReady = useCallOnce(() => {
    const currentScreen = getCurrentRouteName()
    setNavigationMetadata({
      previousScreen: currentScreen,
      currentScreen,
    })
    previousScreen.current = currentScreen

    handlePushNotificationEntry()

    ax.metric('router:navigate', {})

    if (currentAccount && shouldRequestEmailConfirmation(currentAccount)) {
      emailDialogControl.open({
        id: EmailDialogScreenID.VerificationReminder,
      })
      snoozeEmailConfirmationPrompt()
    }

    ax.metric('init', {
      initMs: Math.round(
        // @ts-expect-error Emitted by Metro in the bundle prelude
        performance.now() - global.__BUNDLE_START_TIME__,
      ),
    })

    if (IS_WEB) {
      void Referrer.getReferrerInfo().then(referrerInfo => {
        if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
          ax.metric('deepLink:referrerReceived', {
            to: window.location.href,
            referrer: referrerInfo?.referrer,
            hostname: referrerInfo?.hostname,
          })
        }
      })
    }

    // temp, just testing
    void ax.features.enabled(ax.features.AATest)
  })

  useEffect(() => {
    if (
      !state?.key ||
      !navigationRef.isReady() ||
      previousState.current === state
    )
      return
    const wasReady = previousState.current !== undefined
    previousState.current = state
    onNavigationReady()
    const currentScreen = getCurrentRouteName()
    if (wasReady) {
      setNavigationMetadata({
        previousScreen: previousScreen.current,
        currentScreen,
      })
      ax.metric('router:navigate', {from: previousScreen.current})
      previousScreen.current = currentScreen
    }
  }, [state, navigationRef, onNavigationReady, ax])

  return <ThemeProvider value={theme}>{children}</ThemeProvider>
}

export {RoutesContainer}
export {navigate, reset, resetToTab} from '#/lib/navigation'
