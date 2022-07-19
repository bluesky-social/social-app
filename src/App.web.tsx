import React, {useState, useEffect} from 'react'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import * as Routes from './view/routes'

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
      <Routes.Root />
    </RootStoreProvider>
  )
}

export default App
