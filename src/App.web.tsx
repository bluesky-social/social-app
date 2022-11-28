import React, {useState, useEffect} from 'react'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {DesktopWebShell} from './view/shell/desktop-web'
import Toast from 'react-native-root-toast'

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
      <DesktopWebShell />
      <Toast.ToastContainer />
    </RootStoreProvider>
  )
}

export default App
