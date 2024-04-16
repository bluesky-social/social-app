import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'

import {NavigationProp} from '#/lib/routes/types'
import {useComposerState} from 'state/shell/composer'

export const Composer = observer(function ComposerImpl() {
  const state = useComposerState()
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    if (state) {
      navigation.navigate('Composer')
    }
  }, [state, navigation])

  return null
})
