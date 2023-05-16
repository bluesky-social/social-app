import {useEffect, useReducer} from 'react'
import {DeviceEventEmitter} from 'react-native'
import {useStores} from 'state/index'

export function useUnreadCountLabel() {
  // HACK: We don't have anything like Redux selectors,
  // and we don't want to use <RootStoreContext.Consumer />
  // to react to the whole store
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'unread-notifications',
      forceUpdate,
    )
    return () => subscription?.remove()
  }, [forceUpdate])

  return useStores().me.notifications.unreadCountLabel
}
