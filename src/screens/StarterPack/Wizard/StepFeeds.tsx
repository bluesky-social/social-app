import React from 'react'
import {ListRenderItemInfo} from 'react-native'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {WizardAddDialog} from '#/components/StarterPack/Wizard/WizardAddDialog'
import {WizardFeedCard} from '#/components/StarterPack/Wizard/WizardFeedCard'
import {WizardListEmpty} from '#/components/StarterPack/Wizard/WizardListEmpty'

function keyExtractor(item: GeneratorView) {
  return item.uri
}

export function StepFeeds() {
  const [state, dispatch] = useWizardState()
  const control = useDialogControl()

  const renderItem = ({item}: ListRenderItemInfo<GeneratorView>) => {
    return <WizardFeedCard generator={item} state={state} dispatch={dispatch} />
  }

  return (
    <>
      <List
        data={state.feeds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={[a.flex_1]}
        ListEmptyComponent={<WizardListEmpty type="feeds" />}
      />
      <WizardAddDialog
        control={control}
        type="feeds"
        state={state}
        dispatch={dispatch}
      />
    </>
  )
}
