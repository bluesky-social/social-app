import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from 'lib/routes/types'
import {bskyTitle} from 'lib/strings/headings'
import {useUnreadCountLabel} from './useUnreadCountLabel'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  const unreadCountLabel = useUnreadCountLabel()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title: bskyTitle(title, unreadCountLabel)})
    }
  }, [title, navigation, unreadCountLabel])
}
