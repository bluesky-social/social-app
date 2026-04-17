import {memo, useCallback} from 'react'
import {LayoutAnimation, Platform} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {type ChatBskyConvoDefs, RichText} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {useConvoActive} from '#/state/messages/convo'
import {useLanguagePrefs} from '#/state/preferences'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import * as ContextMenu from '#/components/ContextMenu'
import {type TriggerProps} from '#/components/ContextMenu/types'
import {AfterReportDialog} from '#/components/dms/AfterReportDialog'
import {BubbleQuestion_Stroke2_Corner0_Rounded as TranslateIcon} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {ReportDialog} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {EmojiReactionPicker} from './EmojiReactionPicker'
import {hasReachedReactionLimit} from './util'

export let MessageContextMenu = ({
  message,
  children,
  onTap,
}: {
  message: ChatBskyConvoDefs.MessageView
  children: TriggerProps['children']
  onTap?: () => void
}): React.ReactNode => {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const convo = useConvoActive()
  const deleteControl = usePromptControl()
  const reportControl = usePromptControl()
  const blockOrDeleteControl = usePromptControl()
  const langPrefs = useLanguagePrefs()
  const translate = useGoogleTranslate()

  const isFromSelf = message.sender?.did === currentAccount?.did
  const isGroupChatEnabled = ax.features.enabled(ax.features.GroupChatsEnable)

  const onCopyMessage = useCallback(() => {
    const str = richTextToString(
      new RichText({
        text: message.text,
        facets: message.facets,
      }),
      true,
    )

    void Clipboard.setStringAsync(str)
    Toast.show(l`Copied to clipboard`, {
      type: 'success',
    })
  }, [l, message.text, message.facets])

  const onPressTranslateMessage = useCallback(() => {
    void translate(message.text, langPrefs.primaryLanguage)

    ax.metric('translate', {
      os: Platform.OS,
      possibleSourceLanguages: [], // N/A for chats
      expectedTargetLanguage: langPrefs.primaryLanguage,
      textLength: message.text.length,
      googleTranslate: true,
    })
  }, [ax, langPrefs.primaryLanguage, message.text, translate])

  const onDelete = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    convo
      .deleteMessage(message.id)
      .then(() => Toast.show(l({message: 'Message deleted', context: 'toast'})))
      .catch(() => Toast.show(l`Failed to delete message`))
  }, [l, convo, message.id])

  const onEmojiSelect = useCallback(
    (emoji: string) => {
      if (
        message.reactions?.find(
          reaction =>
            reaction.value === emoji &&
            reaction.sender.did === currentAccount?.did,
        )
      ) {
        convo
          .removeReaction(message.id, emoji)
          .catch(() => Toast.show(l`Failed to remove emoji reaction`))
      } else {
        if (hasReachedReactionLimit(message, currentAccount?.did)) return
        convo.addReaction(message.id, emoji).catch(() =>
          Toast.show(l`Failed to add emoji reaction`, {
            type: 'error',
          }),
        )
      }
    },
    [l, convo, message, currentAccount?.did],
  )

  const sender = convo.convo.members.find(
    member => member.did === message.sender.did,
  )

  return (
    <>
      <ContextMenu.Root>
        {IS_NATIVE && (
          <ContextMenu.AuxiliaryView
            align={isFromSelf ? 'right' : 'left'}
            style={[isFromSelf && isGroupChatEnabled ? null : a.ml_sm]}>
            <EmojiReactionPicker
              message={message}
              onEmojiSelect={onEmojiSelect}
            />
          </ContextMenu.AuxiliaryView>
        )}

        <ContextMenu.Trigger
          label={l`Message options`}
          contentLabel={l`Message from @${
            sender?.handle ?? 'unknown' // should always be defined
          }: ${message.text}`}
          onTap={onTap}>
          {children}
        </ContextMenu.Trigger>

        <ContextMenu.Outer
          align={isFromSelf ? 'right' : 'left'}
          style={[isFromSelf && isGroupChatEnabled ? null : a.ml_sm]}>
          {message.text.length > 0 && (
            <>
              <ContextMenu.Item
                testID="messageDropdownTranslateBtn"
                label={l`Translate`}
                onPress={onPressTranslateMessage}>
                <ContextMenu.ItemText>{l`Translate`}</ContextMenu.ItemText>
                <ContextMenu.ItemIcon icon={TranslateIcon} position="right" />
              </ContextMenu.Item>
              <ContextMenu.Item
                testID="messageDropdownCopyBtn"
                label={l`Copy message text`}
                onPress={onCopyMessage}>
                <ContextMenu.ItemText>
                  {l`Copy message text`}
                </ContextMenu.ItemText>
                <ContextMenu.ItemIcon icon={ClipboardIcon} position="right" />
              </ContextMenu.Item>
              <ContextMenu.Divider />
            </>
          )}
          <ContextMenu.Item
            testID="messageDropdownDeleteBtn"
            label={l`Delete message for me`}
            onPress={() => deleteControl.open()}>
            <ContextMenu.ItemText>{l`Delete for me`}</ContextMenu.ItemText>
            <ContextMenu.ItemIcon icon={TrashIcon} position="right" />
          </ContextMenu.Item>
          {!isFromSelf && (
            <ContextMenu.Item
              testID="messageDropdownReportBtn"
              label={l`Report message`}
              onPress={() => reportControl.open()}>
              <ContextMenu.ItemText>{l`Report`}</ContextMenu.ItemText>
              <ContextMenu.ItemIcon icon={WarningIcon} position="right" />
            </ContextMenu.Item>
          )}
        </ContextMenu.Outer>
      </ContextMenu.Root>
      <ReportDialog
        control={reportControl}
        subject={{
          view: 'message',
          convoId: convo.convo.id,
          message,
        }}
        onAfterSubmit={() => {
          if (sender) {
            unstableCacheProfileView(queryClient, sender)
          }
          blockOrDeleteControl.open()
        }}
      />
      <AfterReportDialog
        control={blockOrDeleteControl}
        currentScreen="conversation"
        params={{
          convoId: convo.convo.id,
          message,
        }}
      />
      <Prompt.Basic
        control={deleteControl}
        title={l`Delete message`}
        description={l`Are you sure you want to delete this message? The message will be deleted for you, but not for the other participants.`}
        confirmButtonCta={l`Delete`}
        confirmButtonColor="negative"
        onConfirm={onDelete}
      />
    </>
  )
}
MessageContextMenu = memo(MessageContextMenu)
