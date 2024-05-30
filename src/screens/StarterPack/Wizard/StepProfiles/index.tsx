import React from 'react'

import {List} from 'view/com/util/List'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a} from '#/alf'

function renderItem() {
  return <WizardProfileCard />
}

export function StepProfiles() {
  return (
    <List data={[1, 2, 3, 4, 5]} renderItem={renderItem} style={[a.flex_1]} />
  )
}
