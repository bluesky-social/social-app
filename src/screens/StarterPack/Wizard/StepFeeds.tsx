import React from 'react'
import {ListRenderItemInfo} from 'react-native'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {useProfileFeedgensQuery} from 'state/queries/profile-feedgens'
import {useSession} from 'state/session'
import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {WizardFeedCard} from '#/screens/StarterPack/Wizard/WizardFeedCard'
import {atoms as a} from '#/alf'

function keyExtractor(item: GeneratorView) {
  return item.uri
}

export function StepFeeds() {
  const {currentAccount} = useSession()
  const {data} = useProfileFeedgensQuery(currentAccount!.did)
  const feeds = data?.pages.flatMap(page => page.feeds) || []
  const [state, dispatch] = useWizardState()

  const renderItem = ({item}: ListRenderItemInfo<GeneratorView>) => {
    return <WizardFeedCard generator={item} state={state} dispatch={dispatch} />
  }

  return (
    <List
      data={feeds}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[a.flex_1]}
    />
  )
}
