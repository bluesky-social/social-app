import {useCallback} from 'react'
import {
  ChatBskyConvoGetConvoForMembers,
  ChatBskyGroupCreateGroup,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useCreateGroupChat} from '#/state/queries/messages/create-group-chat'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {useChatActorStatusQuery} from '#/state/queries/messages/get-status'
import {FAB} from '#/view/com/util/fab/FAB'
import {useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {SearchablePeopleList} from '#/components/dialogs/SearchablePeopleList'
import {InitiateChatFlow} from '#/components/dms/InitiateChatFlow'
import {MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon} from '#/components/icons/Message'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'

export function NewChat({
  control,
  onNewChat,
  startInGroupChat = false,
  onClose,
}: {
  control: Dialog.DialogControlProps
  onNewChat: (chatId: string) => void
  startInGroupChat?: boolean
  onClose?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const requireEmailVerification = useRequireEmailVerification()
  const {data: chatStatus} = useChatActorStatusQuery()
  const chatDisabled = !!chatStatus?.chatDisabled

  const isGroupChatEnabled = !ax.features.enabled(ax.features.GroupChatsDisable)

  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onNewChat(data.convo.id)

      if (!data.convo.lastMessage) {
        ax.metric('chat:create', {logContext: 'NewChatDialog'})
      }
      ax.metric('chat:open', {logContext: 'NewChatDialog'})
    },
    onError: error => {
      logger.error('Failed to create chat', {safeMessage: error})
      let errorMessage = l`An issue occurred starting the chat, please try again.`
      if (isNetworkError(error)) {
        errorMessage = l`A network error occurred. Please check your internet connection.`
      } else if (
        error instanceof ChatBskyConvoGetConvoForMembers.AccountSuspendedError
      ) {
        errorMessage = l`Suspended accounts cannot participate in chat.`
      } else if (
        error instanceof ChatBskyConvoGetConvoForMembers.BlockedActorError
      ) {
        errorMessage = l`This user has blocked you and cannot be messaged.`
      } else if (
        error instanceof ChatBskyConvoGetConvoForMembers.MessagesDisabledError
      ) {
        errorMessage = l`This user has disabled chat and cannot be messaged.`
      } else if (
        error instanceof
        ChatBskyConvoGetConvoForMembers.NotFollowedBySenderError
      ) {
        errorMessage = l`Chat recipient is not followed by the sender.`
      } else if (
        error instanceof ChatBskyConvoGetConvoForMembers.RecipientNotFoundError
      ) {
        errorMessage = l`Unable to find the selected recipient.`
      }
      Toast.show(errorMessage, {
        type: 'error',
      })
    },
  })

  const {mutate: createGroupChat} = useCreateGroupChat({
    onSuccess: data => {
      onNewChat(data.convo.id)
      ax.metric('groupchat:create', {logContext: 'NewChatDialog'})
    },
    onError: error => {
      logger.error('Failed to create groupchat', {safeMessage: error})
      let errorMessage = l`An issue occurred starting the group chat, please try again.`
      if (isNetworkError(error)) {
        errorMessage = l`A network error occurred. Please check your internet connection.`
      } else if (
        error instanceof ChatBskyGroupCreateGroup.AccountSuspendedError
      ) {
        errorMessage = l`Suspended accounts cannot participate in a group chat.`
      } else if (error instanceof ChatBskyGroupCreateGroup.BlockedActorError) {
        errorMessage = l`One of the selected recipients has blocked you and cannot be messaged.`
      } else if (
        error instanceof
        ChatBskyGroupCreateGroup.NewAccountCannotCreateGroupError
      ) {
        errorMessage = l`You cannot create a group chat yet.`
      } else if (
        error instanceof ChatBskyGroupCreateGroup.NotFollowedBySenderError
      ) {
        errorMessage = l`A selected recipient is not followed by the sender.`
      } else if (
        error instanceof ChatBskyGroupCreateGroup.RecipientNotFoundError
      ) {
        errorMessage = l`Unable to find a selected recipient.`
      } else if (
        error instanceof ChatBskyGroupCreateGroup.UserForbidsGroupsError
      ) {
        errorMessage = l`One of the selected recipients does not allow group chats.`
      }
      Toast.show(errorMessage, {
        type: 'error',
      })
    },
  })

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

  const onSelectExistingChat = useCallback(
    (chatId: string) => {
      control.close(() => {
        onNewChat(chatId)
      })
    },
    [control, onNewChat],
  )

  const onPress = useCallback(() => {
    control.open()
  }, [control])
  const wrappedOnPress = requireEmailVerification(onPress, {
    instructions: [
      <Trans key="new-chat">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <>
      {!chatDisabled && (
        <FAB
          testID="newChatFAB"
          onPress={wrappedOnPress}
          icon={<NewChatIcon size="lg" fill={t.palette.white} />}
          accessibilityRole="button"
          accessibilityLabel={l`New chat`}
          accessibilityHint=""
        />
      )}
      <Dialog.Outer
        control={control}
        testID="newChatDialog"
        nativeOptions={{fullHeight: true}}
        onClose={onClose}>
        <Dialog.Handle />
        {isGroupChatEnabled ? (
          <InitiateChatFlow
            // remount when the entry mode changes so the flow re-seeds its
            // initial step (the children stay mounted across open/close)
            key={startInGroupChat ? 'group' : 'default'}
            title={l`New chat`}
            onSelectChat={onCreateChat}
            onSelectGroupChat={onCreateGroupChat}
            sortByMessageDeclaration
            startInGroupChat={startInGroupChat}
          />
        ) : (
          <SearchablePeopleList
            title={l`Start a new chat`}
            onSelectChat={chat => {
              if (chat.kind === 'user') {
                onCreateChat(chat.did)
              } else {
                onSelectExistingChat(chat.id)
              }
            }}
            sortByMessageDeclaration
          />
        )}
      </Dialog.Outer>
    </>
  )
}
