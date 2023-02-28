import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {ThemeProvider} from 'lib/ThemeContext'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {MobileShell} from './view/shell/mobile'
import {s} from 'lib/styles'
import * as notifee from 'lib/notifee'
import * as analytics from 'lib/analytics'
import * as Toast from './view/com/util/Toast'

const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
      notifee.init(store)
      SplashScreen.hide()
      store.hackCheckIfUpgradeNeeded()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          store.nav.handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        store.nav.handleLink(url)
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
    <GestureHandlerRootView style={s.h100pct}>
      <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
        <RootSiblingParent>
          <analytics.Provider>
            <RootStoreProvider value={rootStore}>
              <SafeAreaProvider>
                <MobileShell />
              </SafeAreaProvider>
            </RootStoreProvider>
          </analytics.Provider>
        </RootSiblingParent>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
})

export default App
