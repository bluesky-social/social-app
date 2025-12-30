import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const numUnread = useUnreadNotifications()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title})
    }
  }, [title, navigation, numUnread])
}
