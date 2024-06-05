import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {NavigationProp} from 'lib/routes/types'
import {bskyTitle} from 'lib/strings/headings'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const numUnread = useUnreadNotifications()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, numUnread)})
    }
  }, [title, navigation, numUnread])
}
