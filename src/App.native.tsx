import React, {useState, useEffect} from 'react'
import {RootStore, setupState, RootStoreProvider} from './state'
import * as Routes from './routes'

function App() {
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined)

  // init
  useEffect(() => {
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
