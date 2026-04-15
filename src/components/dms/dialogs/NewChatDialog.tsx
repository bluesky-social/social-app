import {useCallback} from 'react'
import {Trans, useLingui} from '@lingui/react/macro'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {logger} from '#/logger'
import {useCreateGroupChat} from '#/state/queries/messages/create-group-chat'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
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
}: {
  control: Dialog.DialogControlProps
  onNewChat: (chatId: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const requireEmailVerification = useRequireEmailVerification()

  const isGroupChatEnabled = ax.features.enabled(ax.features.GroupChatsEnable)

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
      Toast.show(l`An issue occurred starting the chat, please try again`, {
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
      Toast.show(
        l`An issue occurred creating the group chat, please try again`,
        {
          type: 'error',
        },
      )
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
      <FAB
        testID="newChatFAB"
        onPress={wrappedOnPress}
        icon={<NewChatIcon size="lg" fill={t.palette.white} />}
        accessibilityRole="button"
        accessibilityLabel={l`New chat`}
        accessibilityHint=""
      />
      <Dialog.Outer
        control={control}
        testID="newChatDialog"
        nativeOptions={{fullHeight: true}}>
        <Dialog.Handle />
        {isGroupChatEnabled ? (
          <InitiateChatFlow
            title={l`New chat`}
            onSelectChat={onCreateChat}
            onSelectGroupChat={onCreateGroupChat}
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
