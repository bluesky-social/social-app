import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {ThemeProvider} from 'lib/ThemeContext'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell'
import * as notifee from 'lib/notifee'
import * as analytics from 'lib/analytics'
import * as Toast from './view/com/util/Toast'
import {handleLink} from './Navigation'

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
    <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
      <RootSiblingParent>
        <analytics.Provider>
          <RootStoreProvider value={rootStore}>
            <SafeAreaProvider>
              <Shell />
            </SafeAreaProvider>
          </RootStoreProvider>
        </analytics.Provider>
      </RootSiblingParent>
    </ThemeProvider>
  )
})

export default App
