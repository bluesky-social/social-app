import React from 'react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useComposerState} from '#/state/shell/composer'
import {ComposePost} from '../com/composer/Composer'

export function ComposerScreen() {
  const state = useComposerState()
  const navigation = useNavigation<NavigationProp>()

  if (!state) {
    navigation.goBack()
    return null
  }

  return (
    <ComposePost
      replyTo={state.replyTo}
      quote={state.quote}
      onPost={state.onPost}
      mention={state.mention}
      text={state.text}
    />
  )
}
