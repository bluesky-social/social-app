import React, {useState, useEffect} from 'react'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
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
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={rootStore}>
          <Routes.Root />
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  )
}

export default App
