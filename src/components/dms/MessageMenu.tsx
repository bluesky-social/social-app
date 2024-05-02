import React from 'react'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'

export let MessageMenu = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message,
  control,
}: {
  message: ChatBskyConvoDefs.MessageView
  control: Menu.MenuControlProps
}): React.ReactNode => {
  const {_} = useLingui()
  const deleteControl = usePromptControl()

  const onDelete = React.useCallback(() => {
    // TODO delete the message
  }, [])

  return (
    <>
      <Menu.Root control={control}>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              testID="postDropdownDeleteBtn"
              label={_(msg`Delete message`)}
              onPress={deleteControl.open}>
              <Menu.ItemText>{_(msg`Delete message`)}</Menu.ItemText>
              <Menu.ItemIcon icon={Trash} position="right" />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

      <Prompt.Basic
        control={deleteControl}
        title={_(msg`Delete message`)}
        description={_(
          msg`Are you sure you want to delete this message?? The message will be deleted for you, but not for other participants.`,
        )}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
        onConfirm={onDelete}
      />
    </>
  )
}
MessageMenu = React.memo(MessageMenu)
