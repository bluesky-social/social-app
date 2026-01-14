import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import * as Toast from '#/view/com/util/Toast'
import * as Dialog from '#/components/Dialog'
import {SearchablePeopleList} from '#/components/dialogs/SearchablePeopleList'

export function SendViaChatDialog({
  control,
  onSelectChat,
}: {
  control: Dialog.DialogControlProps
  onSelectChat: (chatId: string) => void
}) {
  return (
    <Dialog.Outer control={control} testID="sendViaChatChatDialog">
      <Dialog.Handle />
      <SendViaChatDialogInner control={control} onSelectChat={onSelectChat} />
    </Dialog.Outer>
  )
}

function SendViaChatDialogInner({
  control,
  onSelectChat,
}: {
  control: Dialog.DialogControlProps
  onSelectChat: (chatId: string) => void
}) {
  const {_} = useLingui()
  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onSelectChat(data.convo.id)

      if (!data.convo.lastMessage) {
        logEvent('chat:create', {logContext: 'SendViaChatDialog'})
      }
      logEvent('chat:open', {logContext: 'SendViaChatDialog'})
    },
    onError: error => {
      logger.error('Failed to share post to chat', {message: error})
      Toast.show(
        _(msg`An issue occurred while trying to open the chat`),
        'xmark',
      )
    },
  })

  const onCreateChat = useCallback(
    (did: string) => {
      control.close(() => createChat([did]))
    },
    [control, createChat],
  )

  return (
    <SearchablePeopleList
      title={_(msg`Send post to...`)}
      onSelectChat={onCreateChat}
      showRecentConvos
      sortByMessageDeclaration
    />
  )
}
