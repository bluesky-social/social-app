import React from 'react'
import {View} from 'react-native'

import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'

export function StepProfiles() {
  const [state, dispatch] = useWizardState()

  return (
    <View style={[a.flex_1, {marginTop: 30}]}>
      <View />
    </View>
  )
}
