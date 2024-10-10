import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function ChangeEmailDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()

  return (
    <Dialog.ScrollableInner label={_(msg`Change email dialog`)}>
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_heavy, a.text_2xl]}>{_(msg`Change email`)}</Text>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
