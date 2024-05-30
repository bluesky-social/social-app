import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'

import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'

export function StepDetails() {
  const [state, dispatch] = useWizardState()

  return (
    <View style={[a.flex_1, a.align_center, {marginTop: 100}]}>
      {state.avatar ? (
        <Image
          source={{uri: state.avatar}}
          style={[{width: 150, height: 150}]}
          accessibilityIgnoresInvertColors={true}
        />
      ) : (
        <View style={[{height: 150, width: 150}]}>
          <ImageIcon />
        </View>
      )}
    </View>
  )
}
