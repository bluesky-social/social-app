import 'react-native-url-polyfill/auto'
import 'lib/sentry' // must be near top

import React, {useState, useEffect} from 'react'
import {RootSiblingParent} from 'react-native-root-siblings'
import * as SplashScreen from 'expo-splash-screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {observer} from 'mobx-react-lite'
import {QueryClientProvider} from '@tanstack/react-query'

import 'view/icons'

import {init as initPersistedState} from '#/state/persisted'
import {useColorMode} from 'state/shell'
import {ThemeProvider} from 'lib/ThemeContext'
import {s} from 'lib/styles'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from 'view/shell'
import * as notifications from 'lib/notifications/notifications'
import * as analytics from 'lib/analytics/analytics'
import * as Toast from 'view/com/util/Toast'
import {queryClient} from 'lib/react-query'
import {TestCtrls} from 'view/com/testing/TestCtrls'
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as PrefsStateProvider} from 'state/preferences'
import {
  Provider as SessionProvider,
  useSession,
  useSessionApi,
} from 'state/session'
import * as persisted from '#/state/persisted'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {messages} from './locale/locales/en/messages'
i18n.load('en', messages)
i18n.activate('en')

SplashScreen.preventAutoHideAsync()

const InnerApp = observer(function AppImpl() {
  const colorMode = useColorMode()
  const {isInitialLoad} = useSession()
  const {resumeSession} = useSessionApi()
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
      notifications.init(store)
      store.onSessionDropped(() => {
        Toast.show('Sorry! Your session expired. Please log in again.')
      })
    })
  }, [])

  useEffect(() => {
    const account = persisted.get('session').currentAccount
    resumeSession(account)
  }, [resumeSession])

  // show nothing prior to init
  if (!rootStore || isInitialLoad) {
    // TODO add a loading state
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={colorMode}>
        <RootSiblingParent>
          <analytics.Provider>
            <RootStoreProvider value={rootStore}>
              <I18nProvider i18n={i18n}>
                <GestureHandlerRootView style={s.h100pct}>
                  <TestCtrls />
                  <Shell />
                </GestureHandlerRootView>
              </I18nProvider>
            </RootStoreProvider>
          </analytics.Provider>
        </RootSiblingParent>
      </ThemeProvider>
    </QueryClientProvider>
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

  return (
    <SessionProvider>
      <ShellStateProvider>
        <PrefsStateProvider>
          <MutedThreadsProvider>
            <InvitesStateProvider>
              <ModalStateProvider>
                <InnerApp />
              </ModalStateProvider>
            </InvitesStateProvider>
          </MutedThreadsProvider>
        </PrefsStateProvider>
      </ShellStateProvider>
    </SessionProvider>
  )
}

export default App
