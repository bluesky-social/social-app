import React from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FAB} from '#/view/com/util/fab/FAB'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '../icons/Envelope'
import {Text} from '../Typography'

export function NewChat() {
  const control = Dialog.useDialogControl()
  const t = useTheme()
  const {_} = useLingui()

  return (
    <>
      <FAB
        testID="newChatFAB"
        onPress={control.open}
        icon={<Envelope size="xl" fill={t.palette.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New chat`)}
        accessibilityHint=""
      />

      <Dialog.Outer control={control} testID="newChatDialog">
        <Dialog.Handle />
        <Dialog.Inner label={_(msg`New chat`)}>
          <Dialog.Close />
          <Text style={a.text_xl}>
            <Trans>New chat</Trans>
          </Text>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
