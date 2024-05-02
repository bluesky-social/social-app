import React from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'

export let MessageMenu = ({
  message,
  onClose,
  control,
}: {
  message: ChatBskyConvoDefs.MessageView
  onClose: () => void
  control: Dialog.DialogControlProps
}): React.ReactNode => {
  const {_} = useLingui()

  return (
    <Dialog.Outer control={control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label="Menu TODO">
        <View style={{height: a.gap_lg.gap}} />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
MessageMenu = React.memo(MessageMenu)
