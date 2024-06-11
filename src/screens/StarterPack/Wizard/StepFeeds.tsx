import React, {useState} from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import debounce from 'lodash.debounce'

import {
  useGetPopularFeedsQuery,
  useSearchPopularFeedsMutation,
} from 'state/queries/feed'
import {SearchInput} from 'view/com/util/forms/SearchInput'
import {List} from 'view/com/util/List'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {WizardFeedCard} from '#/components/StarterPack/Wizard/WizardFeedCard'

function keyExtractor(item: GeneratorView) {
  return item.uri
}

export function StepFeeds() {
  const t = useTheme()
  const [state, dispatch] = useWizardState()
  const [query, setQuery] = useState('')

  const {data: popularFeedsPages, fetchNextPage} = useGetPopularFeedsQuery(30)
  const popularFeeds =
    popularFeedsPages?.pages.flatMap(page => page.feeds) || []

  // const popularFeeds = [
  //   {
  //     uri: 'at://did:plc:i2g4cq5neuol2n5kadpffqok/app.bsky.feed.generator/alice-favs',
  //     cid: 'bafyreidgvy4vlvvhx3lhpyej2qido3m5sk2l5643bhbmqtgfuxwz53xqlm',
  //     did: 'did:plc:epfqsozl6rso6ebd6mkfyzpl',
  //     creator: {
  //       did: 'did:plc:vyhhvdf4xw5nziakfxxsynwk',
  //       handle: 'alice.test',
  //       displayName: 'Alice',
  //       viewer: {
  //         muted: false,
  //         blockedBy: false,
  //       },
  //       labels: [],
  //       description: 'Test user 1',
  //       indexedAt: '2024-06-10T17:37:36.662Z',
  //     },
  //     displayName: 'alices feed',
  //     description: 'all my fav stuff',
  //     avatar:
  //       'http://localhost:2584/img/avatar/plain/did:plc:vyhhvdf4xw5nziakfxxsynwk/bafkreihem6nzbu462kcx5cqnrkonpq75fe5dlbhgnzcmuvvhqk7s5vcq3u@jpeg',
  //     likeCount: 3,
  //     labels: [],
  //     viewer: {
  //       like: 'at://did:plc:vyhhvdf4xw5nziakfxxsynwk/app.bsky.feed.like/3kulmhjxuoc2g',
  //     },
  //     indexedAt: '2022-07-15T00:51:16.914Z',
  //   },
  // ]

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

  const renderItem = ({item}: ListRenderItemInfo<GeneratorView>) => {
    return <WizardFeedCard generator={item} state={state} dispatch={dispatch} />
  }

  return (
    <ScreenTransition style={[a.flex_1]}>
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
        data={query ? searchedFeeds : popularFeeds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={!query ? () => fetchNextPage() : undefined}
        onEndReachedThreshold={2}
        renderScrollComponent={props => <KeyboardAwareScrollView {...props} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
