import {memo, useCallback} from 'react'
import {Platform} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  type ChatBskyConvoDefs,
  type ModerationOpts,
  RichText,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useConvoActive} from '#/state/messages/convo'
import {useLanguagePrefs} from '#/state/preferences'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import * as ContextMenu from '#/components/ContextMenu'
import {type TriggerProps} from '#/components/ContextMenu/types'
import {useMessageDialogs} from '#/components/dms/MessageOverlays'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {Language_Stroke2_Corner2_Rounded as LanguageIcon} from '#/components/icons/Language'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'
import {EmojiReactionPicker} from './EmojiReactionPicker'
import {canReact, hasReachedReactionLimit} from './util'

export let MessageContextMenu = ({
  message,
  senderProfile,
  moderationOpts,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  senderProfile?: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts | undefined
  children: TriggerProps['children']
}): React.ReactNode => {
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const convo = useConvoActive()
  const {openDeleteMessage, openReportMessage, openReply} = useMessageDialogs()
  const langPrefs = useLanguagePrefs()
  const translate = useGoogleTranslate()

  const isFromSelf = message.sender?.did === currentAccount?.did
  const isGroupChatEnabled = !ax.features.enabled(ax.features.GroupChatsDisable)

  const primaryMember = useMaybeProfileShadow(convo.convo.primaryMember)
  const reactionsAvailable = canReact({
    convoState: convo,
    primaryMember,
    moderationOpts,
  })

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
        if (hasReachedReactionLimit(message, currentAccount?.did)) {
          Toast.show(
            l`You cannot add more than ${plural(EMOJI_REACTION_LIMIT, {
              one: '# emoji reaction',
              other: '# emoji reactions',
            })}`,
            {
              type: 'info',
            },
          )
          return
        }
        convo.addReaction(message.id, emoji).catch(() =>
          Toast.show(l`Failed to add emoji reaction`, {
            type: 'error',
          }),
        )
      }
    },
    [l, convo, message, currentAccount?.did],
  )

  const sender = senderProfile

  return (
    <ContextMenu.Root>
      {IS_NATIVE && reactionsAvailable && (
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
        }: ${message.text}`}>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Outer
        align={isFromSelf ? 'right' : 'left'}
        label={l`Sent at ${i18n.date(new Date(message.sentAt), {
          timeStyle: 'short',
        })}`}
        style={[isFromSelf && isGroupChatEnabled ? null : a.ml_sm]}>
        <ContextMenu.Item
          testID="messageDropdownReplyBtn"
          label={l`Reply`}
          onPress={() => openReply(message)}>
          <ContextMenu.ItemIcon icon={ReplyIcon} position="left" />
          <ContextMenu.ItemText>{l`Reply`}</ContextMenu.ItemText>
        </ContextMenu.Item>
        {message.text.length > 0 && (
          <>
            <ContextMenu.Item
              testID="messageDropdownTranslateBtn"
              label={l`Translate`}
              onPress={onPressTranslateMessage}>
              <ContextMenu.ItemIcon icon={LanguageIcon} position="left" />
              <ContextMenu.ItemText>{l`Translate`}</ContextMenu.ItemText>
            </ContextMenu.Item>
            <ContextMenu.Item
              testID="messageDropdownCopyBtn"
              label={l`Copy message text`}
              onPress={onCopyMessage}>
              <ContextMenu.ItemIcon icon={ClipboardIcon} position="left" />
              <ContextMenu.ItemText>
                {l`Copy message text`}
              </ContextMenu.ItemText>
            </ContextMenu.Item>
          </>
        )}
        <ContextMenu.Item
          destructive
          testID="messageDropdownDeleteBtn"
          label={l`Delete message for me`}
          onPress={() => openDeleteMessage(message)}>
          <ContextMenu.ItemIcon icon={TrashIcon} position="left" />
          <ContextMenu.ItemText>{l`Delete for me`}</ContextMenu.ItemText>
        </ContextMenu.Item>
        {!isFromSelf && (
          <ContextMenu.Item
            destructive
            testID="messageDropdownReportBtn"
            label={l`Report message`}
            onPress={() => openReportMessage(message, senderProfile)}>
            <ContextMenu.ItemIcon icon={FlagIcon} position="left" />
            <ContextMenu.ItemText>{l`Report`}</ContextMenu.ItemText>
          </ContextMenu.Item>
        )}
      </ContextMenu.Outer>
    </ContextMenu.Root>
  )
}
MessageContextMenu = memo(MessageContextMenu)
