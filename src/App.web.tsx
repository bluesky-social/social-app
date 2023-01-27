import React, {useState, useEffect} from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {WebShell} from './view/shell/web'
import {ToastContainer} from './view/com/util/Toast.web'

function App() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(setRootStore)
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider>
        <WebShell />
      </SafeAreaProvider>
      <ToastContainer />
    </RootStoreProvider>
  )
}

export default App
