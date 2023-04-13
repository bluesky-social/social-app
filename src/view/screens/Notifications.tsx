import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {InvitedUsers} from '../com/notifications/InvitedUsers'
import {LoadLatestBtn} from 'view/com/util/LoadLatestBtn'
import {useStores} from 'state/index'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'

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

    // event handlers
    // =
    const onPressTryAgain = React.useCallback(() => {
      store.me.notifications.refresh()
    }, [store])

    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: 0})
    }, [scrollElRef])

    const onPressLoadLatest = React.useCallback(() => {
      store.me.notifications.processQueue()
      scrollToTop()
    }, [store, scrollToTop])

    // on-visible setup
    // =
    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        store.log.debug('NotificationsScreen: Updating feed')
        const softResetSub = store.onScreenSoftReset(onPressLoadLatest)
        store.me.notifications.syncQueue()
        store.me.notifications.update()
        screen('Notifications')

        return () => {
          softResetSub.remove()
          store.me.notifications.markAllUnqueuedRead()
        }
      }, [store, screen, onPressLoadLatest]),
    )

    return (
      <View testID="notificationsScreen" style={s.hContentRegion}>
        <ViewHeader title="Notifications" canGoBack={false} />
        <InvitedUsers />
        <Feed
          view={store.me.notifications}
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          scrollElRef={scrollElRef}
        />
        {store.me.notifications.hasNewLatest &&
          !store.me.notifications.isRefreshing && (
            <LoadLatestBtn onPress={onPressLoadLatest} label="notifications" />
          )}
      </View>
    )
  }),
)
