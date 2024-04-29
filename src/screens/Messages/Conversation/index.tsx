import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>
export function MessagesConversationScreen({route}: Props) {
  const chatId = route.params.conversation
  const {_} = useLingui()
  return (
    <CenteredView style={{flex: 1}} sideBorders>
      <ViewHeader
        title={_(msg`Chat with ${chatId}`)}
        showOnDesktop
        showBorder
      />
      <MessagesList />
    </CenteredView>
  )
}
