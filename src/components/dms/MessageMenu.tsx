import React from 'react'
import {LayoutAnimation, Pressable, View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useChat} from 'state/messages'
import {ConvoStatus} from 'state/messages/convo'
import {useSession} from 'state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '../icons/Clipboard'

export let MessageMenu = ({
  message,
  control,
  hideTrigger,
  triggerOpacity,
}: {
  hideTrigger?: boolean
  triggerOpacity?: number
  onTriggerPress?: () => void
  message: ChatBskyConvoDefs.MessageView
  control: Menu.MenuControlProps
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const chat = useChat()
  const deleteControl = usePromptControl()
  const retryDeleteControl = usePromptControl()

  const isFromSelf = message.sender?.did === currentAccount?.did

  const onCopyPostText = React.useCallback(() => {
    // use when we have rich text
    // const str = richTextToString(richText, true)

    Clipboard.setStringAsync(message.text)
    Toast.show(_(msg`Copied to clipboard`))
  }, [_, message.text])

  const onDelete = React.useCallback(() => {
    if (chat.status !== ConvoStatus.Ready) return

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    chat
      .deleteMessage(message.id)
      .then(() => Toast.show(_(msg`Message deleted`)))
      .catch(() => retryDeleteControl.open())
  }, [_, chat, message.id, retryDeleteControl])

  const onReport = React.useCallback(() => {
    // TODO report the message
  }, [])

  return (
    <>
      <Menu.Root control={control}>
        {!hideTrigger && (
          <View style={{opacity: triggerOpacity}}>
            <Menu.Trigger label={_(msg`Chat settings`)}>
              {({props, state}) => (
                <Pressable
                  {...props}
                  style={[
                    a.p_sm,
                    a.rounded_full,
                    (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                  ]}>
                  <DotsHorizontal size="sm" style={t.atoms.text} />
                </Pressable>
              )}
            </Menu.Trigger>
          </View>
        )}

        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              testID="messageDropdownCopyBtn"
              label={_(msg`Copy message text`)}
              onPress={onCopyPostText}>
              <Menu.ItemText>{_(msg`Copy message text`)}</Menu.ItemText>
              <Menu.ItemIcon icon={ClipboardIcon} position="right" />
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            <Menu.Item
              testID="messageDropdownDeleteBtn"
              label={_(msg`Delete message for me`)}
              onPress={deleteControl.open}>
              <Menu.ItemText>{_(msg`Delete for me`)}</Menu.ItemText>
              <Menu.ItemIcon icon={Trash} position="right" />
            </Menu.Item>
            {!isFromSelf && (
              <Menu.Item
                testID="messageDropdownReportBtn"
                label={_(msg`Report message`)}
                onPress={onReport}>
                <Menu.ItemText>{_(msg`Report`)}</Menu.ItemText>
                <Menu.ItemIcon icon={Warning} position="right" />
              </Menu.Item>
            )}
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

      <Prompt.Basic
        control={deleteControl}
        title={_(msg`Delete message`)}
        description={_(
          msg`Are you sure you want to delete this message? The message will be deleted for you, but not for other participants.`,
        )}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
        onConfirm={onDelete}
      />

      <Prompt.Basic
        control={retryDeleteControl}
        title={_(msg`Failed to delete message`)}
        description={_(
          msg`An error occurred while trying to delete the message. Please try again.`,
        )}
        confirmButtonCta={_(msg`Retry`)}
        confirmButtonColor="negative"
        onConfirm={onDelete}
      />
    </>
  )
}
MessageMenu = React.memo(MessageMenu)
