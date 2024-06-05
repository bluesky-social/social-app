import React from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'

import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a} from '#/alf'
import {WizardListEmpty} from '#/components/StarterPack/Wizard/WizardListEmpty'

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

export function StepProfiles() {
  const [state, dispatch] = useWizardState()

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) => {
    return (
      <WizardProfileCard profile={item} state={state} dispatch={dispatch} />
    )
  }

  return (
    <>
      <View style={[a.flex_1]}>
        <List
          data={state.profiles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<WizardListEmpty type="profiles" />}
        />
      </View>
    </>
  )
}
