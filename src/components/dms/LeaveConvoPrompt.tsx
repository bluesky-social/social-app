import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import * as Toast from '#/view/com/util/Toast'
import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function LeaveConvoPrompt({
  control,
  convoId,
  currentScreen,
}: {
  control: DialogOuterProps['control']
  convoId: string
  currentScreen: 'list' | 'conversation'
}) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onSuccess: () => {
      if (currentScreen === 'conversation') {
        navigation.replace(
          'Messages',
          isNative
            ? {
                animation: 'pop',
              }
            : {},
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
        msg`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant.`,
      )}
      confirmButtonCta={_(msg`Leave`)}
      confirmButtonColor="negative"
      onConfirm={() => leaveConvo()}
    />
  )
}
