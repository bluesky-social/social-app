import React, {useState} from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {AppBskyActorDefs} from '@atproto/api'

import {useActorAutocompleteQuery} from 'state/queries/actor-autocomplete'
import {useProfileFollowsQuery} from 'state/queries/profile-follows'
import {useSession} from 'state/session'
import {SearchInput} from 'view/com/util/forms/SearchInput'
import {List} from 'view/com/util/List'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'
import {Loader} from '#/components/Loader'
import {WizardProfileCard} from '#/components/StarterPack/Wizard/WizardProfileCard'

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

export function StepProfiles() {
  const [state, dispatch] = useWizardState()
  const [query, setQuery] = useState('')

  const {currentAccount} = useSession()
  const {data: followsPages, fetchNextPage} = useProfileFollowsQuery(
    currentAccount?.did,
  )
  const follows = followsPages?.pages.flatMap(page => page.follows) || []

  const {data: results} = useActorAutocompleteQuery(
    query || encodeURIComponent('*'),
    true,
    12,
  )

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppBskyActorDefs.ProfileViewBasic>) => {
    return (
      <WizardProfileCard profile={item} state={state} dispatch={dispatch} />
    )
  }

  return (
    <ScreenTransition>
      <View style={[a.my_sm, a.px_md, {height: 40}]}>
        <SearchInput
          query={query}
          onChangeQuery={setQuery}
          onPressCancelSearch={() => setQuery('')}
          onSubmitQuery={() => {}}
        />
      </View>
      <List
        data={query ? results : follows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={!query ? () => fetchNextPage() : undefined}
        onEndReachedThreshold={2}
        renderScrollComponent={props => <KeyboardAwareScrollView {...props} />}
        containWeb={true}
        sideBorders={false}
        ListEmptyComponent={
          <View style={[a.flex_1, a.align_center, a.mt_lg]}>
            <Loader size="lg" />
          </View>
        }
      />
    </ScreenTransition>
  )
}
