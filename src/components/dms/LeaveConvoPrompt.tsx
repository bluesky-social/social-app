import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import * as Toast from '#/view/com/util/Toast'
import {type DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {IS_NATIVE} from '#/env'

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
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(
          StackActions.replace('Messages', IS_NATIVE ? {animation: 'pop'} : {}),
        )
      }
    },
    onError: () => {
      Toast.show(_(msg`Could not leave chat`), 'xmark')
    },
  })

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Leave conversation`)}
      description={_(
        hasMessages
          ? msg`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant.`
          : msg`Are you sure you want to leave this conversation?`,
      )}
      confirmButtonCta={_(msg`Leave`)}
      confirmButtonColor="negative"
      onConfirm={() => leaveConvo()}
    />
  )
}
