import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Clipboard_Stroke2_Corner2_Rounded as Clipboard} from '#/components/icons/Clipboard'
import {Group3_Stroke2_Corner0_Rounded as Group3} from '#/components/icons/Group3'

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
  const t = useTheme()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.Inner label="Tag">
        <Text style={[a.font_bold, a.pb_lg, t.atoms.text_contrast_medium]}>
          Tag: {tag}
        </Text>

        <View style={[a.w_full, a.flex_row, a.gap_lg, a.mb_lg]}>
          <Button
            label="tag"
            size="large"
            variant="outline"
            color="secondary"
            style={[a.flex_1]}>
            <ButtonText>Copy</ButtonText>
            <ButtonIcon icon={Clipboard} position="right" />
          </Button>
          <Button
            label="tag"
            size="large"
            variant="outline"
            color="primary"
            style={[a.flex_1]}>
            <ButtonText>Search</ButtonText>
            <ButtonIcon icon={Search} position="right" />
          </Button>
        </View>

        <Button label="tag" size="large" variant="solid" color="secondary">
          <ButtonText>Search posts by this user</ButtonText>
          <ButtonIcon icon={Group3} position="right" />
        </Button>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
