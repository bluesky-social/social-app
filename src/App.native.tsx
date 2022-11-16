import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {whenWebCrypto} from './platform/polyfills.native'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {MobileShell} from './view/shell/mobile'

function App() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    whenWebCrypto
      .then(() => {
        view.setup()
        return setupState()
      })
      .then(store => {
        setRootStore(store)
        SplashScreen.hide()
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
          <SafeAreaProvider>
            <MobileShell />
          </SafeAreaProvider>
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  )
}

export default App
