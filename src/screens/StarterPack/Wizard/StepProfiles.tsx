import {useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {type ModerationOpts} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {useA11y} from '#/state/a11y'
import {useActorSearch} from '#/state/queries/actor-search'
import {List} from '#/view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {useAutocomplete} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'
import {Loader} from '#/components/Loader'
import {ScreenTransition} from '#/components/ScreenTransition'
import {WizardProfileCard} from '#/components/StarterPack/Wizard/WizardListCard'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

function keyExtractor(item: bsky.profile.AnyProfileView) {
  return item?.did ?? ''
}

export function StepProfiles({
  moderationOpts,
}: {
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const [state, dispatch] = useWizardState()
  const [query, setQuery] = useState('')
  const {screenReaderEnabled} = useA11y()

  const {
    data: topPages,
    fetchNextPage,
    isLoading: isLoadingTopPages,
  } = useActorSearch({
    query: encodeURIComponent('*'),
  })
  const topFollowers = topPages?.pages
    .flatMap(p => p.actors)
    .filter(p => !p.associated?.labeler)

  const {items: autocompleteItems, isFetching: isFetchingResults} =
    useAutocomplete({
      type: 'profile',
      query,
      limit: 12,
    })
  const results = autocompleteItems
    .filter(item => item.type === 'profile')
    .map(item => item.profile)
    .filter(profile => !profile.associated?.labeler)

  const isLoading = isLoadingTopPages || isFetchingResults

  const renderItem = ({
    item,
  }: ListRenderItemInfo<bsky.profile.AnyProfileView>) => {
    return (
      <WizardProfileCard
        profile={item}
        btnType="checkbox"
        state={state}
        dispatch={dispatch}
        moderationOpts={moderationOpts}
      />
    )
  }

  return (
    <ScreenTransition
      style={[a.flex_1]}
      direction={state.transitionDirection}
      enabledWeb>
      <View style={[a.border_b, t.atoms.border_contrast_medium]}>
        <View style={[a.py_sm, a.px_md, {height: 60}]}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            onClearText={() => setQuery('')}
          />
        </View>
      </View>
      <List
        data={query ? results : topFollowers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderScrollComponent={props => <KeyboardAwareScrollView {...props} />}
        keyboardShouldPersistTaps="handled"
        disableFullWindowScroll={true}
        sideBorders={false}
        style={[a.flex_1]}
        onEndReached={
          !query && !screenReaderEnabled ? () => fetchNextPage() : undefined
        }
        onEndReachedThreshold={IS_NATIVE ? 2 : 0.25}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={[a.flex_1, a.align_center, a.mt_lg, a.px_lg]}>
            {isLoading ? (
              <Loader size="lg" />
            ) : (
              <Text
                style={[
                  a.font_semi_bold,
                  a.text_lg,
                  a.text_center,
                  a.mt_lg,
                  a.leading_snug,
                ]}>
                <Trans>Nobody was found. Try searching for someone else.</Trans>
              </Text>
            )}
          </View>
        }
      />
    </ScreenTransition>
  )
}
