import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'

export function StepDetails() {
  const {_} = useLingui()
  const t = useTheme()
  const [state] = useWizardState()

  // const [avatar, setAvatar] = React.useState(state.avatar)
  const [name, setName] = React.useState(state.name)
  const [description, setDescription] = React.useState(state.description)

  return (
    <View style={[a.flex_1, {marginTop: 30}]}>
      <View style={[a.align_center, a.gap_sm]}>
        {state.avatar ? (
          <Image
            source={{uri: state.avatar}}
            style={[{width: 150, height: 150}]}
            accessibilityIgnoresInvertColors={true}
          />
        ) : (
          <View
            style={[
              a.align_center,
              a.justify_center,
              t.atoms.bg_contrast_25,
              {height: 160, width: 160, borderRadius: 30},
            ]}>
            <ImageIcon width={135} height={135} />
          </View>
        )}
        <Button
          label={_(msg`Edit image`)}
          onPress={() => {}}
          variant="ghost"
          color="primary"
          size="small">
          <ButtonText style={[a.text_md]}>
            <Trans>Edit image</Trans>
          </ButtonText>
        </Button>
      </View>
      <View style={[a.px_xl, a.mt_5xl, a.gap_xl]}>
        <View>
          <TextField.LabelText>{_(msg`Starter pack name`)}</TextField.LabelText>
          <TextField.Input
            label={_(msg`Starter pack name`)}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View>
          <TextField.LabelText>{_(msg`Description`)}</TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={_(
                msg`Write a short description of your starter pack. What can new users expect?`,
              )}
              value={description}
              onChangeText={setDescription}
              multiline
              style={{minHeight: 150}}
            />
          </TextField.Root>
        </View>
      </View>
    </View>
  )
}
