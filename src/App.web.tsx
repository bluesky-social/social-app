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
import {Provider as ShellStateProvider} from 'state/shell'
import {Provider as ModalStateProvider} from 'state/modals'
import {Provider as MutedThreadsProvider} from 'state/muted-threads'
import {Provider as InvitesStateProvider} from 'state/invites'
import {Provider as PrefsStateProvider} from 'state/preferences'

const InnerApp = observer(function AppImpl() {
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
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={colorMode}>
        <RootSiblingParent>
          <analytics.Provider>
            <RootStoreProvider value={rootStore}>
              <SafeAreaProvider>
                <Shell />
              </SafeAreaProvider>
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
  )
}

export default App
