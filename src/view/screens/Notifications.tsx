import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {useOnMainScroll} from '../lib/hooks/useOnMainScroll'

export const Notifications = ({navIdx, visible}: ScreenParams) => {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)

  useEffect(() => {
    if (!visible) {
      return
    }
    store.log.debug('Updating notifications feed')
    store.me.refreshMemberships() // needed for the invite notifications
    store.me.notifications
      .update()
      .catch(e => {
        store.log.error('Error while updating notifications feed', e.toString())
      })
      .then(() => {
        store.me.notifications.updateReadState()
      })
    store.nav.setTitle(navIdx, 'Notifications')
  }, [visible, store])

  const onPressTryAgain = () => {
    store.me.notifications.refresh()
  }

  return (
    <View style={{flex: 1}}>
      <ViewHeader title="Notifications" canGoBack={false} />
      <Feed
        view={store.me.notifications}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
      />
    </View>
  )
}
