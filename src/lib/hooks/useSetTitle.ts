import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'

export function useSetTitle(title?: string) {
  const navigation = useNavigation<NavigationProp>()
  useEffect(() => {
    if (title) {
      navigation.setOptions({title})
    }
  }, [title, navigation])
}
