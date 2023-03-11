import React, {useState, useEffect} from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell/index'
import {ToastContainer} from './view/com/util/Toast.web'

function App() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider>
        <Shell />
      </SafeAreaProvider>
      <ToastContainer />
    </RootStoreProvider>
  )
}

export default App
