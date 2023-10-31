import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import 'lib/sentry' // must be relatively on top
import {withSentry} from 'lib/sentry'
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
import {QueryClientProvider} from '@tanstack/react-query'
import {queryClient} from 'lib/react-query'
import {TestCtrls} from 'view/com/testing/TestCtrls'
// For Waverly
import {useFonts} from 'expo-font'

SplashScreen.preventAutoHideAsync()

const App = observer(function AppImpl() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // For Waverly
  const [fontsLoaded] = useFonts({
    'SF-Pro-Text-Thin': require('../assets/fonts/SF-Pro-Text-Thin.otf'),
    'SF-Pro-Text-Regular': require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    'SF-Pro-Text-Medium': require('../assets/fonts/SF-Pro-Text-Medium.otf'),
    'SF-Pro-Text-Bold': require('../assets/fonts/SF-Pro-Text-Bold.otf'),
    'SF-Pro-Text-Heavy': require('../assets/fonts/SF-Pro-Text-Heavy.otf'),
    'SF-Pro-Display-Medium': require('../assets/fonts/SF-Pro-Display-Medium.otf'),
    'SF-Pro-Display-Bold': require('../assets/fonts/SF-Pro-Display-Bold.otf'),
    'NewYorkMedium-Regular': require('../assets/fonts/NewYorkMedium-Regular.otf'),
  })

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
      notifications.init(store)
      store.onSessionDropped(() => {
        Toast.show('Sorry! Your session expired. Please log in again.')
      })
    })
  }, [])

  // show nothing prior to init
  if (!rootStore || !fontsLoaded) {
    return null
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={rootStore.shell.colorMode}>
        <RootSiblingParent>
          <analytics.Provider>
            <RootStoreProvider value={rootStore}>
              <GestureHandlerRootView style={s.h100pct}>
                <TestCtrls />
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
