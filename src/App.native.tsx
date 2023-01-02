import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {ThemeProvider} from './view/lib/ThemeContext'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {MobileShell} from './view/shell/mobile'

const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
      SplashScreen.hide()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          store.nav.handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        store.nav.handleLink(url)
      })
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={rootStore}>
          <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
            <SafeAreaProvider>
              <MobileShell />
            </SafeAreaProvider>
          </ThemeProvider>
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  )
})

export default App
