import React, {useEffect} from 'react'
import {FlatList, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {useOnMainScroll} from '../lib/hooks/useOnMainScroll'
import {s} from '../lib/styles'
import {useAnalytics} from '@segment/analytics-react-native'

export const Notifications = ({navIdx, visible}: ScreenParams) => {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const scrollElRef = React.useRef<FlatList>(null)
  const {screen} = useAnalytics()

  const onSoftReset = () => {
    scrollElRef.current?.scrollToOffset({offset: 0})
  }

  useEffect(() => {
    const softResetSub = store.onScreenSoftReset(onSoftReset)
    const cleanup = () => {
      softResetSub.remove()
    }
    if (!visible) {
      return cleanup
    }
    store.log.debug('Updating notifications feed')
    store.me.notifications.update().then(() => {
      store.me.notifications.updateReadState()
    })
    screen('Notifications')
    store.nav.setTitle(navIdx, 'Notifications')
    return cleanup
  }, [visible, store, navIdx, screen])

  const onPressTryAgain = () => {
    store.me.notifications.refresh()
  }

  return (
    <View style={s.h100pct}>
      <ViewHeader title="Notifications" canGoBack={false} />
      <Feed
        view={store.me.notifications}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
        scrollElRef={scrollElRef}
      />
    </View>
  )
}
