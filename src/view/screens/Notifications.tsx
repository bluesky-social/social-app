import React, {useEffect} from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {useStores} from 'state/index'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'

const NOTIFICATIONS_POLL_INTERVAL = 15e3

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export const NotificationsScreen = withAuthRequired(
  observer(({}: Props) => {
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
    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        store.log.debug('NotificationsScreen: Updating feed')
        const softResetSub = store.onScreenSoftReset(scrollToTop)
        store.me.notifications.loadUnreadCount()
        store.me.notifications.loadLatest()
        screen('Notifications')

        return () => {
          softResetSub.remove()
          store.me.notifications.markAllRead()
        }
      }, [store, screen, scrollToTop]),
    )

    return (
      <View testID="notificationsScreen" style={s.hContentRegion}>
        <ViewHeader title="Notifications" canGoBack={false} />
        <Feed
          view={store.me.notifications}
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          scrollElRef={scrollElRef}
        />
      </View>
    )
  }),
)
