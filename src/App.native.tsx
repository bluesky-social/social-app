import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import 'lib/sentry' // must be relatively on top
import {withSentry} from 'lib/sentry'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import * as SplashScreen from 'expo-splash-screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {observer} from 'mobx-react-lite'
import {ThemeProvider} from 'lib/ThemeContext'
import {s} from 'lib/styles'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell'
import * as notifications from 'lib/notifications/notifications'
import * as analytics from 'lib/analytics/analytics'
import * as Toast from './view/com/util/Toast'
import {handleLink} from './Navigation'
import {QueryClientProvider} from '@tanstack/react-query'
import {queryClient} from 'lib/react-query'

SplashScreen.preventAutoHideAsync()

const App = observer(function AppImpl() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
      notifications.init(store)
      SplashScreen.hideAsync()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        handleLink(url)
      })
      store.onSessionDropped(() => {
        Toast.show('Sorry! Your session expired. Please log in again.')
      })
    })
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
              <GestureHandlerRootView style={s.h100pct}>
                <Shell />
              </GestureHandlerRootView>
            </RootStoreProvider>
          </analytics.Provider>
        </RootSiblingParent>
      </ThemeProvider>
    </QueryClientProvider>
  )
})

export default withSentry(App)
