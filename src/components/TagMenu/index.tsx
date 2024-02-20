import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Group3_Stroke2_Corner0_Rounded as Group3} from '#/components/icons/Group3'

export function useTagMenuControl() {
  return Dialog.useDialogControl()
}

export function TagMenu({
  children,
  control,
  tag,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  tag: string
}>) {
  const t = useTheme()

  return (
    <>
      {children}

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner label="Tag">
          <Text style={[a.font_bold, a.pb_lg, t.atoms.text_contrast_medium]}>
            Tag: {tag}
          </Text>

          <View style={[a.gap_lg]}>
            <Button label="tag" size="large" variant="outline" color="primary">
              <ButtonText>See all {tag} posts</ButtonText>
              <ButtonIcon icon={Search} position="right" />
            </Button>

            <Button label="tag" size="large" variant="solid" color="secondary">
              <ButtonText>See all {tag} posts by this user</ButtonText>
              <ButtonIcon icon={Group3} position="right" />
            </Button>
            <Button label="tag" size="large" variant="solid" color="secondary">
              <ButtonText>Mute {tag}</ButtonText>
              <ButtonIcon icon={Group3} position="right" />
            </Button>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
