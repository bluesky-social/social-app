import React from 'react'
import {ListRenderItemInfo, View} from 'react-native'

import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a} from '#/alf'

function renderItem({item}: ListRenderItemInfo<number>) {
  return <WizardProfileCard />
}

export function StepProfiles() {
  const [state, dispatch] = useWizardState()
  const initialNumToRender = useInitialNumToRender()

  return <List data={[1]} renderItem={renderItem} style={[a.flex_1]} />
}
