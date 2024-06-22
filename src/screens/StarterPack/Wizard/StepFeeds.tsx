import React, {useState} from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {AppBskyFeedDefs, ModerationOpts} from '@atproto/api'
import debounce from 'lodash.debounce'

import {useA11y} from '#/state/a11y'
import {DISCOVER_FEED_URI} from 'lib/constants'
import {
  useGetPopularFeedsQuery,
  useSavedFeeds,
  useSearchPopularFeedsMutation,
} from 'state/queries/feed'
import {SearchInput} from 'view/com/util/forms/SearchInput'
import {List} from 'view/com/util/List'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {ScreenTransition} from '#/components/StarterPack/Wizard/ScreenTransition'
import {WizardFeedCard} from '#/components/StarterPack/Wizard/WizardListCard'

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
  return item.uri
}

export function StepFeeds({moderationOpts}: {moderationOpts: ModerationOpts}) {
  const t = useTheme()
  const [state, dispatch] = useWizardState()
  const [query, setQuery] = useState('')
  const {screenReaderEnabled} = useA11y()

  const {data: savedFeedsAndLists} = useSavedFeeds()
  const savedFeeds = savedFeedsAndLists?.feeds
    .filter(f => f.type === 'feed' && f.view.uri !== DISCOVER_FEED_URI)
    .map(f => f.view) as AppBskyFeedDefs.GeneratorView[]

  const {data: popularFeedsPages, fetchNextPage} = useGetPopularFeedsQuery({
    limit: 30,
  })
  const popularFeeds =
    popularFeedsPages?.pages
      .flatMap(page => page.feeds)
      .filter(f => !savedFeeds?.some(sf => sf?.uri === f.uri)) ?? []

  const suggestedFeeds = savedFeeds?.concat(popularFeeds)

  const {
    data: searchedFeeds,
    mutate: search,
    reset: resetSearch,
  } = useSearchPopularFeedsMutation()

  const debouncedSearch = React.useMemo(
    () => debounce(q => search(q), 500), // debounce for 500ms
    [search],
  )

  const onChangeQuery = (text: string) => {
    setQuery(text)
    if (text.length > 1) {
      debouncedSearch(text)
    } else {
      resetSearch()
    }
  }

  const renderItem = ({
    item,
  }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) => {
    return (
      <WizardFeedCard
        generator={item}
        state={state}
        dispatch={dispatch}
        moderationOpts={moderationOpts}
      />
    )
  }

  return (
    <ScreenTransition style={[a.flex_1]} direction={state.transitionDirection}>
      <View style={[a.border_b, t.atoms.border_contrast_medium]}>
        <View style={[a.my_sm, a.px_md, {height: 40}]}>
          <SearchInput
            query={query}
            onChangeQuery={onChangeQuery}
            onPressCancelSearch={() => setQuery('')}
            onSubmitQuery={() => {}}
          />
        </View>
      </View>
      <List
        data={query ? searchedFeeds : suggestedFeeds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{paddingTop: 6}}
        onEndReached={
          !query && !screenReaderEnabled ? () => fetchNextPage() : undefined
        }
        onEndReachedThreshold={2}
        renderScrollComponent={props => <KeyboardAwareScrollView {...props} />}
        keyboardShouldPersistTaps="handled"
        containWeb={true}
        sideBorders={false}
        style={{flex: 1}}
        ListEmptyComponent={
          <View style={[a.flex_1, a.align_center, a.mt_lg]}>
            <Loader size="lg" />
          </View>
        }
      />
    </ScreenTransition>
  )
}
