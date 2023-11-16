import 'lib/sentry' // must be near top

import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {QueryClientProvider} from '@tanstack/react-query'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootSiblingParent} from 'react-native-root-siblings'

import 'view/icons'

import {init as initPersistedState} from '#/state/persisted'
import {init as initReminders} from '#/state/shell/reminders'
import {useColorMode} from 'state/shell'
import * as analytics from 'lib/analytics/analytics'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from 'view/shell/index'
import {ToastContainer} from 'view/com/util/Toast.web'
import {ThemeProvider} from 'lib/ThemeContext'
import {queryClient} from 'lib/react-query'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {defaultLocale, dynamicActivate} from './locale/i18n'
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as LightboxStateProvider} from 'state/lightbox'
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as PrefsStateProvider} from 'state/preferences'
import {
  Provider as SessionProvider,
  useSession,
  useSessionApi,
} from 'state/session'
import {Provider as UnreadNotifsProvider} from 'state/queries/notifications/unread'
import * as persisted from '#/state/persisted'

const InnerApp = observer(function AppImpl() {
  const {isInitialLoad} = useSession()
  const {resumeSession} = useSessionApi()
  const colorMode = useColorMode()
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    setupState().then(store => {
      setRootStore(store)
    })
  }, [])

  useEffect(() => {
    initReminders()
    analytics.init()
    dynamicActivate(defaultLocale) // async import of locale data

    const account = persisted.get('session').currentAccount
    resumeSession(account)
  }, [resumeSession])

  // show nothing prior to init
  if (!rootStore || isInitialLoad) {
    // TODO add a loading state
    return null
  }

  /*
   * Session and initial state should be loaded prior to rendering below.
   */

  return (
    <UnreadNotifsProvider>
      <ThemeProvider theme={colorMode}>
        <analytics.Provider>
          <RootStoreProvider value={rootStore}>
            <I18nProvider i18n={i18n}>
              {/* All components should be within this provider */}
              <RootSiblingParent>
                <SafeAreaProvider>
                  <Shell />
                </SafeAreaProvider>
              </RootSiblingParent>
            </I18nProvider>
            <ToastContainer />
          </RootStoreProvider>
        </analytics.Provider>
      </ThemeProvider>
    </UnreadNotifsProvider>
  )
})

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
                    <InnerApp />
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
