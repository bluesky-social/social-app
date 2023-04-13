import React, {useState, useEffect} from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootSiblingParent} from 'react-native-root-siblings'
import * as view from './view/index'
import * as analytics from 'lib/analytics'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {Shell} from './view/shell/index'
import {ToastContainer} from './view/com/util/Toast.web'
import {ThemeProvider} from 'lib/ThemeContext'
import {observer} from 'mobx-react-lite'

const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    view.setup()
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
      <RootSiblingParent>
        <analytics.Provider>
          <RootStoreProvider value={rootStore}>
            <SafeAreaProvider>
              <Shell />
            </SafeAreaProvider>
            <ToastContainer />
          </RootStoreProvider>
        </analytics.Provider>
      </RootSiblingParent>
    </ThemeProvider>
  )
})

export default App
