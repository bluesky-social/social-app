import 'react-native-url-polyfill/auto'
import 'lib/sentry' // must be near top
import 'view/icons'

import React, {useEffect, useState} from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {Provider as StatsigProvider} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {readLastActiveAccount} from '#/state/session/util'
import {useIntentHandler} from 'lib/hooks/useIntentHandler'
import {useNotificationsListener} from 'lib/notifications/notifications'
import {QueryProvider} from 'lib/react-query'
import {s} from 'lib/styles'
import {ThemeProvider} from 'lib/ThemeContext'
import {Provider as DialogStateProvider} from 'state/dialogs'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as LightboxStateProvider} from 'state/lightbox'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as PrefsStateProvider} from 'state/preferences'
import {Provider as UnreadNotifsProvider} from 'state/queries/notifications/unread'
import {
  Provider as SessionProvider,
  SessionAccount,
  useSession,
  useSessionApi,
} from 'state/session'
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as LoggedOutViewProvider} from 'state/shell/logged-out'
import {Provider as SelectedFeedProvider} from 'state/shell/selected-feed'
import {TestCtrls} from 'view/com/testing/TestCtrls'
import * as Toast from 'view/com/util/Toast'
import {Shell} from 'view/shell'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Provider as PortalProvider} from '#/components/Portal'
import {Splash} from '#/Splash'
import I18nProvider from './locale/i18nProvider'
import {listenSessionDropped} from './state/events'

SplashScreen.preventAutoHideAsync()

function InnerApp() {
  const [isReady, setIsReady] = React.useState(false)
  const {currentAccount} = useSession()
  const {initSession} = useSessionApi()
  const theme = useColorModeTheme()
  const {_} = useLingui()

  useIntentHandler()

  // init
  useEffect(() => {
    async function resumeSession(account?: SessionAccount) {
      try {
        if (account) {
          await initSession(account)
        }
      } catch (e) {
        logger.error(`session: resumeSession failed`, {message: e})
      } finally {
        setIsReady(true)
      }
    }
    const account = readLastActiveAccount()
    resumeSession(account)
  }, [initSession])

  useEffect(() => {
    return listenSessionDropped(() => {
      Toast.show(_(msg`Sorry! Your session expired. Please log in again.`))
    })
  }, [_])

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Alf theme={theme}>
        <ThemeProvider theme={theme}>
          <Splash isReady={isReady}>
            <RootSiblingParent>
              <React.Fragment
                // Resets the entire tree below when it changes:
                key={currentAccount?.did}>
                <QueryProvider currentDid={currentAccount?.did}>
                  <PushNotificationsListener>
                    <StatsigProvider>
                      {/* LabelDefsProvider MUST come before ModerationOptsProvider */}
                      <LabelDefsProvider>
                        <ModerationOptsProvider>
                          <LoggedOutViewProvider>
                            <SelectedFeedProvider>
                              <UnreadNotifsProvider>
                                <GestureHandlerRootView style={s.h100pct}>
                                  <TestCtrls />
                                  <Shell />
                                </GestureHandlerRootView>
                              </UnreadNotifsProvider>
                            </SelectedFeedProvider>
                          </LoggedOutViewProvider>
                        </ModerationOptsProvider>
                      </LabelDefsProvider>
                    </StatsigProvider>
                  </PushNotificationsListener>
                </QueryProvider>
              </React.Fragment>
            </RootSiblingParent>
          </Splash>
        </ThemeProvider>
      </Alf>
    </SafeAreaProvider>
  )
}

function PushNotificationsListener({children}: {children: React.ReactNode}) {
  const queryClient = useQueryClient()
  useNotificationsListener(queryClient)
  return children
}

function App() {
  const [isReady, setReady] = useState(false)

  React.useEffect(() => {
    initPersistedState().then(() => setReady(true))
  }, [])

  if (!isReady) {
    return null
  }

  /*
   * NOTE: only nothing here can depend on other data or session state, since
   * that is set up in the InnerApp component above.
   */
  return (
    <SessionProvider>
      <ShellStateProvider>
        <PrefsStateProvider>
          <MutedThreadsProvider>
            <InvitesStateProvider>
              <ModalStateProvider>
                <DialogStateProvider>
                  <LightboxStateProvider>
                    <I18nProvider>
                      <PortalProvider>
                        <InnerApp />
                      </PortalProvider>
                    </I18nProvider>
                  </LightboxStateProvider>
                </DialogStateProvider>
              </ModalStateProvider>
            </InvitesStateProvider>
          </MutedThreadsProvider>
        </PrefsStateProvider>
      </ShellStateProvider>
    </SessionProvider>
  )
}

export default App
