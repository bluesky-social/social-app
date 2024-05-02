import React from 'react'
import {Pressable, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from 'state/session'
import {atoms as a, useTheme} from '#/alf'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'

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
  const deleteControl = usePromptControl()

  const isFromSelf = message.sender?.did === currentAccount?.did

  const onDelete = React.useCallback(() => {
    // TODO delete the message
  }, [])

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
              testID="messageDropdownDeleteBtn"
              label={_(msg`Delete message`)}
              onPress={deleteControl.open}>
              <Menu.ItemText>{_(msg`Delete`)}</Menu.ItemText>
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
    </>
  )
}
MessageMenu = React.memo(MessageMenu)
