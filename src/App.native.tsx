import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {whenWebCrypto} from './platform/polyfills.native'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell'

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
      .then(setRootStore)
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={rootStore}>
          <Shell />
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  )
}

export default App
