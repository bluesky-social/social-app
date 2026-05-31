import {useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {type DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
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
    onError: () => {
      Toast.show(l`Could not leave chat`, {
        type: 'error',
      })
    },
  })

  return (
    <Prompt.Basic
      control={control}
      title={l`Leave conversation`}
      description={
        hasMessages
          ? l`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant.`
          : l`Are you sure you want to leave this conversation?`
      }
      confirmButtonCta={l`Leave`}
      confirmButtonColor="negative"
      onConfirm={() => leaveConvo()}
    />
  )
}
