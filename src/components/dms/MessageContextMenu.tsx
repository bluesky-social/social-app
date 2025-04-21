import {memo, useCallback} from 'react'
import {LayoutAnimation} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {type ChatBskyConvoDefs, RichText} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {getTranslatorLink} from '#/locale/helpers'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useConvoActive} from '#/state/messages/convo'
import {useLanguagePrefs} from '#/state/preferences'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import * as ContextMenu from '#/components/ContextMenu'
import {type TriggerProps} from '#/components/ContextMenu/types'
import {ReportDialog} from '#/components/dms/ReportDialog'
import {BubbleQuestion_Stroke2_Corner0_Rounded as Translate} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'
import {EmojiReactionPicker} from './EmojiReactionPicker'
import {hasReachedReactionLimit} from './util'

export let MessageContextMenu = ({
  message,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  children: TriggerProps['children']
}): React.ReactNode => {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const convo = useConvoActive()
  const deleteControl = usePromptControl()
  const reportControl = usePromptControl()
  const langPrefs = useLanguagePrefs()
  const openLink = useOpenLink()

  const isFromSelf = message.sender?.did === currentAccount?.did

  const onCopyMessage = useCallback(() => {
    const str = richTextToString(
      new RichText({
        text: message.text,
        facets: message.facets,
      }),
      true,
    )

    Clipboard.setStringAsync(str)
    Toast.show(_(msg`Copied to clipboard`), 'clipboard-check')
  }, [_, message.text, message.facets])

  const onPressTranslateMessage = useCallback(() => {
    const translatorUrl = getTranslatorLink(
      message.text,
      langPrefs.primaryLanguage,
    )
    openLink(translatorUrl, true)

    logger.metric('translate', {
      sourceLanguages: [],
      targetLanguage: langPrefs.primaryLanguage,
      textLength: message.text.length,
    })
  }, [langPrefs.primaryLanguage, message.text, openLink])

  const onDelete = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    convo
      .deleteMessage(message.id)
      .then(() =>
        Toast.show(_(msg({message: 'Message deleted', context: 'toast'}))),
      )
      .catch(() => Toast.show(_(msg`Failed to delete message`)))
  }, [_, convo, message.id])

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
          .catch(() => Toast.show(_(msg`Failed to remove emoji reaction`)))
      } else {
        if (hasReachedReactionLimit(message, currentAccount?.did)) return
        convo
          .addReaction(message.id, emoji)
          .catch(() =>
            Toast.show(_(msg`Failed to add emoji reaction`), 'xmark'),
          )
      }
    },
    [_, convo, message, currentAccount?.did],
  )

  const sender = convo.convo.members.find(
    member => member.did === message.sender.did,
  )

  return (
    <>
      <ContextMenu.Root>
        {isNative && (
          <ContextMenu.AuxiliaryView align={isFromSelf ? 'right' : 'left'}>
            <EmojiReactionPicker
              message={message}
              onEmojiSelect={onEmojiSelect}
            />
          </ContextMenu.AuxiliaryView>
        )}

        <ContextMenu.Trigger
          label={_(msg`Message options`)}
          contentLabel={_(
            msg`Message from @${
              sender?.handle ?? // should always be defined
              'unknown'
            }: ${message.text}`,
          )}>
          {children}
        </ContextMenu.Trigger>

        <ContextMenu.Outer align={isFromSelf ? 'right' : 'left'}>
          {message.text.length > 0 && (
            <>
              <ContextMenu.Item
                testID="messageDropdownTranslateBtn"
                label={_(msg`Translate`)}
                onPress={onPressTranslateMessage}>
                <ContextMenu.ItemText>{_(msg`Translate`)}</ContextMenu.ItemText>
                <ContextMenu.ItemIcon icon={Translate} position="right" />
              </ContextMenu.Item>
              <ContextMenu.Item
                testID="messageDropdownCopyBtn"
                label={_(msg`Copy message text`)}
                onPress={onCopyMessage}>
                <ContextMenu.ItemText>
                  {_(msg`Copy message text`)}
                </ContextMenu.ItemText>
                <ContextMenu.ItemIcon icon={ClipboardIcon} position="right" />
              </ContextMenu.Item>
              <ContextMenu.Divider />
            </>
          )}
          <ContextMenu.Item
            testID="messageDropdownDeleteBtn"
            label={_(msg`Delete message for me`)}
            onPress={() => deleteControl.open()}>
            <ContextMenu.ItemText>{_(msg`Delete for me`)}</ContextMenu.ItemText>
            <ContextMenu.ItemIcon icon={Trash} position="right" />
          </ContextMenu.Item>
          {!isFromSelf && (
            <ContextMenu.Item
              testID="messageDropdownReportBtn"
              label={_(msg`Report message`)}
              onPress={() => reportControl.open()}>
              <ContextMenu.ItemText>{_(msg`Report`)}</ContextMenu.ItemText>
              <ContextMenu.ItemIcon icon={Warning} position="right" />
            </ContextMenu.Item>
          )}
        </ContextMenu.Outer>
      </ContextMenu.Root>

      <ReportDialog
        currentScreen="conversation"
        params={{type: 'convoMessage', convoId: convo.convo.id, message}}
        control={reportControl}
      />

      <Prompt.Basic
        control={deleteControl}
        title={_(msg`Delete message`)}
        description={_(
          msg`Are you sure you want to delete this message? The message will be deleted for you, but not for the other participant.`,
        )}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
        onConfirm={onDelete}
      />
    </>
  )
}
MessageContextMenu = memo(MessageContextMenu)
