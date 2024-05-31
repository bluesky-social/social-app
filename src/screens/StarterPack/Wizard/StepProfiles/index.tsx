import React from 'react'
import {ListRenderItemInfo} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'

import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a} from '#/alf'

function renderItem({
  item,
}: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) {
  return <WizardProfileCard profile={item} />
}

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

export function StepProfiles() {
  const [state] = useWizardState()

  return (
    <List
      data={state.profiles}
      renderItem={renderItem}
      style={[a.flex_1]}
      keyExtractor={keyExtractor}
    />
  )
}
