import 'lib/sentry' // must be near top

import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {QueryClientProvider} from '@tanstack/react-query'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootSiblingParent} from 'react-native-root-siblings'

import 'view/icons'

import * as analytics from 'lib/analytics/analytics'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from 'view/shell/index'
import {ToastContainer} from 'view/com/util/Toast.web'
import {ThemeProvider} from 'lib/ThemeContext'
import {queryClient} from 'lib/react-query'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {defaultLocale, dynamicActivate} from './locale/i18n'

const App = observer(function AppImpl() {
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
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={rootStore.shell.colorMode}>
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

export default App
