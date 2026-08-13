import {useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {isNetworkError} from '#/lib/strings/errors'
import {matchXrpcError} from '#/lib/xrpc-error'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {type DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {IS_NATIVE} from '#/env'
import {chat} from '#/lexicons'

export function LeaveConvoPrompt({
  control,
  convoId,
  currentScreen,
  hasMessages = true,
}: {
  control: DialogOuterProps['control']
  convoId: string
  currentScreen: 'list' | 'conversation'
  hasMessages?: boolean
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(
          StackActions.replace('Messages', IS_NATIVE ? {animation: 'pop'} : {}),
        )
      }
    },
    onError: error => {
      let errorMessage = l`Could not leave chat`
      if (isNetworkError(error)) {
        errorMessage = l`A network error occurred. Please check your internet connection.`
      } else {
        switch (matchXrpcError(error, chat.bsky.convo.leaveConvo)) {
          case 'InvalidConvo':
            errorMessage = l`Conversation not found.`
            break
          case 'OwnerCannotLeave':
            errorMessage = l`Owner must lock the group before leaving.`
            break
        }
      }
      Toast.show(errorMessage, {type: 'error'})
    },
  })

  return (
    <Prompt.Basic
      control={control}
      title={l`Leave conversation`}
      description={
        hasMessages
          ? l`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participants.`
          : l`Are you sure you want to leave this conversation?`
      }
      confirmButtonCta={l`Leave`}
      confirmButtonColor="negative"
      onConfirm={() => leaveConvo()}
    />
  )
}
