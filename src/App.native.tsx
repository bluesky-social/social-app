import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {SegmentClient, AnalyticsProvider} from '@segment/analytics-react-native'
import {TabPurpose} from './state/models/navigation'
import {ThemeProvider} from './view/lib/ThemeContext'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {MobileShell} from './view/shell/mobile'
import {s} from './view/lib/styles'
import notifee, {EventType} from '@notifee/react-native'
import * as analytics from './lib/analytics'
import * as Toast from './view/com/util/Toast'

const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )
  const [segment, setSegment] = useState<SegmentClient | undefined>(undefined)

  // init
  useEffect(() => {
    view.setup()
    setSegment(analytics.segmentClient)
    setupState().then(store => {
      setRootStore(store)
      analytics.init(store)
      SplashScreen.hide()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          store.nav.handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        store.nav.handleLink(url)
      })
      store.onSessionDropped(() => {
        Toast.show('Sorry! Your session expired. Please log in again.')
      })
      notifee.onForegroundEvent(async ({type}: {type: EventType}) => {
        store.log.debug('Notifee foreground event', {type})
        if (type === EventType.PRESS) {
          store.log.debug('User pressed a notifee, opening notifications')
          store.nav.switchTo(TabPurpose.Notifs, true)
        }
      })
      notifee.onBackgroundEvent(async _e => {}) // notifee requires this but we handle it with onForegroundEvent
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }
  return (
    <GestureHandlerRootView style={s.h100pct}>
      <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
        <RootSiblingParent>
          <AnalyticsProvider client={segment}>
            <RootStoreProvider value={rootStore}>
              <SafeAreaProvider>
                <MobileShell />
              </SafeAreaProvider>
            </RootStoreProvider>
          </AnalyticsProvider>
        </RootSiblingParent>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
})

export default App
