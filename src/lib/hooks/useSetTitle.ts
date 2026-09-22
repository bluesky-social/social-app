import {useEffect} from 'react'

import {useNavigation} from '#/lib/navigation'
import {type NavigationProp} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const numUnread = useUnreadNotifications()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, numUnread)})
    }
  }, [title, navigation, numUnread])
}
