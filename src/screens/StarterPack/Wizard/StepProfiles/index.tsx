import React from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardProfileCard} from '#/screens/StarterPack/Wizard/StepProfiles/WizardProfileCard'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

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
    <View style={[a.flex_1]}>
      {state.profiles.length > 0 ? (
        <List
          data={state.profiles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      ) : (
        <ListEmpty />
      )}
    </View>
  )
}

function ListEmpty() {
  return (
    <View style={[a.flex_1, a.px_md, a.align_center]}>
      <Text style={[a.font_bold, a.text_xl, a.text_center, {marginTop: 100}]}>
        <Trans>Add the people you recommend to your starter pack!</Trans>
      </Text>
    </View>
  )
}
