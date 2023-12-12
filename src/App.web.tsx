import 'lib/sentry' // must be near top

import React, {useState, useEffect} from 'react'
import {QueryClientProvider} from '@tanstack/react-query'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootSiblingParent} from 'react-native-root-siblings'

import 'view/icons'

import {init as initPersistedState} from '#/state/persisted'
import {useColorMode} from 'state/shell'
import {Shell} from 'view/shell/index'
import {ToastContainer} from 'view/com/util/Toast.web'
import {ThemeProvider} from 'lib/ThemeContext'
import {queryClient} from 'lib/react-query'
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as LightboxStateProvider} from 'state/lightbox'
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as PrefsStateProvider} from 'state/preferences'
import {Provider as LoggedOutViewProvider} from 'state/shell/logged-out'
import I18nProvider from './locale/i18nProvider'
import {
  Provider as SessionProvider,
  useSession,
  useSessionApi,
} from 'state/session'
import {Provider as UnreadNotifsProvider} from 'state/queries/notifications/unread'
import * as persisted from '#/state/persisted'

function InnerApp() {
  const {isInitialLoad, currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const colorMode = useColorMode()

  // init
  useEffect(() => {
    const account = persisted.get('session').currentAccount
    resumeSession(account)
  }, [resumeSession])

  // wait for session to resume
  if (isInitialLoad) return null

  return (
    <React.Fragment
      // Resets the entire tree below when it changes:
      key={currentAccount?.did}>
      <LoggedOutViewProvider>
        <UnreadNotifsProvider>
          <ThemeProvider theme={colorMode}>
            {/* All components should be within this provider */}
            <RootSiblingParent>
              <SafeAreaProvider>
                <Shell />
              </SafeAreaProvider>
            </RootSiblingParent>
            <ToastContainer />
          </ThemeProvider>
        </UnreadNotifsProvider>
      </LoggedOutViewProvider>
    </React.Fragment>
  )
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
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ShellStateProvider>
          <PrefsStateProvider>
            <MutedThreadsProvider>
              <InvitesStateProvider>
                <ModalStateProvider>
                  <LightboxStateProvider>
                    <I18nProvider>
                      <InnerApp />
                    </I18nProvider>
                  </LightboxStateProvider>
                </ModalStateProvider>
              </InvitesStateProvider>
            </MutedThreadsProvider>
          </PrefsStateProvider>
        </ShellStateProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default App
