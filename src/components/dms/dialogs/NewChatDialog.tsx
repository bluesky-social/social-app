import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useEmail} from '#/lib/hooks/useEmail'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {FAB} from '#/view/com/util/fab/FAB'
import * as Toast from '#/view/com/util/Toast'
import {useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {SearchablePeopleList} from '#/components/dialogs/SearchablePeopleList'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'

export function NewChat({
  control,
  onNewChat,
}: {
  control: Dialog.DialogControlProps
  onNewChat: (chatId: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {needsEmailVerification} = useEmail()
  const verifyEmailControl = useDialogControl()

  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onNewChat(data.convo.id)

      if (!data.convo.lastMessage) {
        logEvent('chat:create', {logContext: 'NewChatDialog'})
      }
      logEvent('chat:open', {logContext: 'NewChatDialog'})
    },
    onError: error => {
      logger.error('Failed to create chat', {safeMessage: error})
      Toast.show(_(msg`An issue occurred starting the chat`), 'xmark')
    },
  })

  const onCreateChat = useCallback(
    (did: string) => {
      control.close(() => createChat([did]))
    },
    [control, createChat],
  )

  return (
    <>
      <FAB
        testID="newChatFAB"
        onPress={() => {
          if (needsEmailVerification) {
            verifyEmailControl.open()
          } else {
            control.open()
          }
        }}
        icon={<Plus size="lg" fill={t.palette.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New chat`)}
        accessibilityHint=""
      />

      <Dialog.Outer control={control} testID="newChatDialog">
        <Dialog.Handle />
        <SearchablePeopleList
          title={_(msg`Start a new chat`)}
          onSelectChat={onCreateChat}
          sortByMessageDeclaration
        />
      </Dialog.Outer>

      <VerifyEmailDialog
        reasonText={_(
          msg`Before you may message another user, you must first verify your email.`,
        )}
        control={verifyEmailControl}
      />
    </>
  )
}
