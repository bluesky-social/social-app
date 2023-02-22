import React, {useEffect} from 'react'
import {FlatList, View} from 'react-native'
import useAppState from 'react-native-appstate-hook'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {useStores} from 'state/index'
import {ScreenParams} from '../routes'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'

const NOTIFICATIONS_POLL_INTERVAL = 15e3

export const Notifications = ({navIdx, visible}: ScreenParams) => {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const scrollElRef = React.useRef<FlatList>(null)
  const {screen} = useAnalytics()
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })

  // event handlers
  // =
  const onPressTryAgain = () => {
    store.me.notifications.refresh()
  }
  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0})
  }, [scrollElRef])

  // periodic polling
  // =
  const doPoll = React.useCallback(
    async (isForegrounding = false) => {
      if (isForegrounding) {
        // app is foregrounding, refresh optimistically
        store.log.debug('NotificationsScreen: Refreshing on app foreground')
        await Promise.all([
          store.me.notifications.loadUnreadCount(),
          store.me.notifications.refresh(),
        ])
      } else if (appState === 'active') {
        // periodic poll, refresh if there are new notifs
        store.log.debug('NotificationsScreen: Polling for new notifications')
        const didChange = await store.me.notifications.loadUnreadCount()
        if (didChange) {
          store.log.debug('NotificationsScreen: Loading new notifications')
          await store.me.notifications.loadLatest()
        }
      }
    },
    [appState, store],
  )
  useEffect(() => {
    const pollInterval = setInterval(doPoll, NOTIFICATIONS_POLL_INTERVAL)
    return () => clearInterval(pollInterval)
  }, [doPoll])

  // on-visible setup
  // =
  useEffect(() => {
    if (!visible) {
      return
    }
    store.log.debug('NotificationsScreen: Updating feed')
    const softResetSub = store.onScreenSoftReset(scrollToTop)
    store.me.notifications.update().then(() => {
      store.me.notifications.markAllRead()
    })
    screen('Notifications')
    store.nav.setTitle(navIdx, 'Notifications')
    return () => {
      softResetSub.remove()
    }
  }, [visible, store, navIdx, screen, scrollToTop])

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
