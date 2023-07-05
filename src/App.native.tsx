import 'react-native-url-polyfill/auto'
import 'lib/sentry' // must be relatively on top

import * as SplashScreen from 'expo-splash-screen'
import * as Toast from './view/com/util/Toast'
import * as analytics from 'lib/analytics/analytics'
import * as notifee from 'lib/notifee'
import * as view from './view/index'

import React, {useEffect, useState} from 'react'
import {RootStoreModel, RootStoreProvider, setupState} from './state'

import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import {Shell} from './view/shell'
import {ThemeProvider} from 'lib/ThemeContext'
import {handleLink} from './Navigation'
import {observer} from 'mobx-react-lite'
import {s} from 'lib/styles'
import {withSentry} from 'lib/sentry'

SplashScreen.preventAutoHideAsync()

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
      notifee.init(store)
      SplashScreen.hideAsync()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        handleLink(url)
      })
      store.onSessionDropped(() => {
        Toast.show('Sorry! Your session expired. Please log in again.')
      })
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }
  return (
    <ThemeProvider theme={rootStore.shell.colorMode}>
      <RootSiblingParent>
        <analytics.Provider>
          <RootStoreProvider value={rootStore}>
            <GestureHandlerRootView style={s.h100pct}>
              <Shell />
            </GestureHandlerRootView>
          </RootStoreProvider>
        </analytics.Provider>
      </RootSiblingParent>
    </ThemeProvider>
  )
})

export default withSentry(App)
