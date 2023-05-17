import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from 'lib/routes/types'
import {bskyTitle} from 'lib/strings/headings'
import {useStores} from 'state/index'

/**
 * Requires consuming component to be wrapped in `observer`:
 * https://stackoverflow.com/a/71488009
 */
export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const {unreadCountLabel} = useStores().me.notifications
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, unreadCountLabel)})
    }
  }, [title, navigation, unreadCountLabel])
}
