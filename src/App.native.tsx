import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import moment from 'moment'
import {whenWebCrypto} from './platform/polyfills.native'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import * as Routes from './view/routes'

moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%ds',
    m: 'a minute',
    mm: '%dm',
    h: 'an hour',
    hh: '%dh',
    d: 'a day',
    dd: '%dd',
    w: 'a week',
    ww: '%dw',
    M: 'a month',
    MM: '%dmo',
    y: 'a year',
    yy: '%dy',
  },
})

function App() {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )

  // init
  useEffect(() => {
    whenWebCrypto.then(() => setupState()).then(setRootStore)
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
