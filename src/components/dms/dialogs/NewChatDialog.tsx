import React, {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {logEvent} from 'lib/statsig/statsig'
import {FAB} from '#/view/com/util/fab/FAB'
import * as Toast from '#/view/com/util/Toast'
import {useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SearchablePeopleList} from './SearchablePeopleList'

export function NewChat({
  control,
  onNewChat,
}: {
  control: Dialog.DialogControlProps
  onNewChat: (chatId: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onNewChat(data.convo.id)

      if (!data.convo.lastMessage) {
        logEvent('chat:create', {logContext: 'NewChatDialog'})
      }
      logEvent('chat:open', {logContext: 'NewChatDialog'})
    },
    onError: error => {
      Toast.show(error.message)
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
        onPress={control.open}
        icon={<Plus size="lg" fill={t.palette.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New chat`)}
        accessibilityHint=""
      />

      <Dialog.Outer
        control={control}
        testID="newChatDialog"
        nativeOptions={{sheet: {snapPoints: ['100%']}}}>
        <SearchablePeopleList
          title={_(msg`Start a new chat`)}
          onSelectChat={onCreateChat}
        />
      </Dialog.Outer>
    </>
  )
}
