import 'lib/sentry' // must be near top

import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {QueryClientProvider} from '@tanstack/react-query'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootSiblingParent} from 'react-native-root-siblings'

import 'view/icons'

import {init as initPersistedState} from '#/state/persisted'
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
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as PrefsStateProvider} from 'state/preferences'
import {
  Provider as SessionProvider,
  useSession,
  useSessionApi,
} from 'state/session'
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
      analytics.init(store)
    })
    dynamicActivate(defaultLocale) // async import of locale data
  }, [resumeSession])

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
                <SafeAreaProvider>
                  <Shell />
                </SafeAreaProvider>
              </I18nProvider>
              <ToastContainer />
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
