import React from 'react'
//import {View} from 'react-native'

//import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function useTagMenuControl() {
  return Dialog.useDialogControl()
}

export function TagMenu({
  control,
  tag,
}: {
  control: Dialog.DialogOuterProps['control']
  tag: string
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.Inner label="Tag">
        <Text>Tag: {tag}</Text>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
