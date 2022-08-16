import React, {useState, useEffect} from 'react'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell'
import Toast from './view/com/util/Toast'

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
      <Shell />
      <Toast.ToastContainer />
    </RootStoreProvider>
  )
}

export default App
