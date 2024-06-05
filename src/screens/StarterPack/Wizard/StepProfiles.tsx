import React from 'react'
import {ListRenderItemInfo} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'

import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {useDialogControl} from '#/components/Dialog'
import {WizardAddDialog} from '#/components/StarterPack/Wizard/WizardAddDialog'
import {WizardListEmpty} from '#/components/StarterPack/Wizard/WizardListEmpty'
import {WizardProfileCard} from '#/components/StarterPack/Wizard/WizardProfileCard'

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

export function StepProfiles() {
  const [state, dispatch] = useWizardState()
  const control = useDialogControl()

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) => {
    return (
      <WizardProfileCard profile={item} state={state} dispatch={dispatch} />
    )
  }

  return (
    <>
      <List
        data={state.profiles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={<WizardListEmpty type="profiles" />}
      />
      <WizardAddDialog
        control={control}
        type="profiles"
        state={state}
        dispatch={dispatch}
      />
    </>
  )
}
