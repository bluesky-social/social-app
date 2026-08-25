import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {isNetworkError} from '#/lib/strings/errors'
import {matchXrpcError} from '#/lib/xrpc-error'
import {logger} from '#/logger'
import {useCreateGroupChat} from '#/state/queries/messages/create-group-chat'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import * as Dialog from '#/components/Dialog'
import {SearchablePeopleList} from '#/components/dialogs/SearchablePeopleList'
import {InitiateChatFlow} from '#/components/dms/InitiateChatFlow'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {chat} from '#/lexicons'

export function SendViaChatDialog({
  control,
  onSelectChat,
}: {
  control: Dialog.DialogControlProps
  onSelectChat: (chatId: string) => void
}) {
  const [flowKey, setFlowKey] = useState(0)
  const onClose = useCallback(() => setFlowKey(key => key + 1), [])

  return (
    <Dialog.Outer
      control={control}
      testID="sendViaChatChatDialog"
      nativeOptions={{fullHeight: true}}
      onClose={onClose}>
      <Dialog.Handle />
      <SendViaChatDialogInner
        control={control}
        flowKey={flowKey}
        onSelectChat={onSelectChat}
      />
    </Dialog.Outer>
  )
}

function SendViaChatDialogInner({
  control,
  flowKey,
  onSelectChat,
}: {
  control: Dialog.DialogControlProps
  flowKey: number
  onSelectChat: (chatId: string) => void
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const isGroupChatEnabled = !ax.features.enabled(ax.features.GroupChatsDisable)

  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onSelectChat(data.convo.id)

      if (!data.convo.lastMessage) {
        ax.metric('chat:create', {logContext: 'SendViaChatDialog'})
      }
      ax.metric('chat:open', {logContext: 'SendViaChatDialog'})
    },
    onError: error => {
      logger.error('Failed to share post to chat', {safeMessage: error})
      let errorMessage = l`An issue occurred starting the chat, please try again.`
      if (isNetworkError(error)) {
        errorMessage = l`A network error occurred. Please check your internet connection.`
      } else {
        switch (matchXrpcError(error, chat.bsky.convo.getConvoForMembers)) {
          case 'AccountSuspended':
            errorMessage = l`Suspended accounts cannot participate in chat.`
            break
          case 'BlockedActor':
            errorMessage = l`This user has blocked you and cannot be messaged.`
            break
          case 'MessagesDisabled':
            errorMessage = l`This user has disabled chat and cannot be messaged.`
            break
          case 'NotFollowedBySender':
            errorMessage = l`Chat recipient is not followed by the sender.`
            break
          case 'RecipientNotFound':
            errorMessage = l`Unable to find the selected recipient.`
            break
        }
      }
      Toast.show(errorMessage, {
        type: 'error',
      })
    },
  })

  const {mutate: createGroupChat} = useCreateGroupChat({
    onSuccess: data => {
      onSelectChat(data.convo.id)

      ax.metric('groupchat:create', {logContext: 'SendViaChatDialog'})
    },
    onError: error => {
      logger.error('Failed to share post to group chat', {safeMessage: error})
      let errorMessage = l`An issue occurred starting the group chat, please try again.`
      if (isNetworkError(error)) {
        errorMessage = l`A network error occurred. Please check your internet connection.`
      } else {
        switch (matchXrpcError(error, chat.bsky.group.createGroup)) {
          case 'AccountSuspended':
            errorMessage = l`Suspended accounts cannot participate in a group chat.`
            break
          case 'BlockedActor':
            errorMessage = l`One of the selected recipients has blocked you and cannot be messaged.`
            break
          case 'NewAccountCannotCreateGroup':
            errorMessage = l`You cannot create a group chat yet.`
            break
          case 'NotFollowedBySender':
            errorMessage = l`A selected recipient is not followed by the sender.`
            break
          case 'RecipientNotFound':
            errorMessage = l`Unable to find a selected recipient.`
            break
          case 'UserForbidsGroups':
            errorMessage = l`One of the selected recipients does not allow group chats.`
            break
        }
      }
      Toast.show(errorMessage, {
        type: 'error',
      })
    },
  })

  const onSelectExistingChat = useCallback(
    (chatId: string) => {
      control.close(() => onSelectChat(chatId))
    },
    [control, onSelectChat],
  )

  const onCreateChat = useCallback(
    (did: string) => {
      control.close(() => createChat([did]))
    },
    [control, createChat],
  )

  const onCreateGroupChat = useCallback(
    (members: string[], name: string) => {
      control.close(() => {
        createGroupChat({members, name})
      })
    },
    [control, createGroupChat],
  )

  return isGroupChatEnabled ? (
    <InitiateChatFlow
      key={flowKey}
      title={l`Send post to...`}
      onSelectChat={onCreateChat}
      onSelectExistingChat={onSelectExistingChat}
      onSelectGroupChat={onCreateGroupChat}
      showRecentConvos
      sortByMessageDeclaration
    />
  ) : (
    <SearchablePeopleList
      title={l`Send post to...`}
      onSelectChat={chat => {
        if (chat.kind === 'user') {
          onCreateChat(chat.did)
        } else {
          onSelectExistingChat(chat.id)
        }
      }}
      showRecentConvos
      sortByMessageDeclaration
    />
  )
}
