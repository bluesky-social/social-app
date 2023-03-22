import React from 'react'
import {
  Keyboard,
  RefreshControl,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ScrollView} from 'view/com/util/Views'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {SearchUIModel} from 'state/models/ui/search'
import {FoafsModel} from 'state/models/discovery/foafs'
import {SuggestedActorsModel} from 'state/models/discovery/suggested-actors'
import {HeaderWithInput} from 'view/com/search/HeaderWithInput'
import {Suggestions} from 'view/com/search/Suggestions'
import {SearchResults} from 'view/com/search/SearchResults'
import {s} from 'lib/styles'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {usePalette} from 'lib/hooks/usePalette'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer<Props>(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const scrollElRef = React.useRef<ScrollView>(null)
    const onMainScroll = useOnMainScroll(store)
    const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
    const [query, setQuery] = React.useState<string>('')
    const autocompleteView = React.useMemo<UserAutocompleteViewModel>(
      () => new UserAutocompleteViewModel(store),
      [store],
    )
    const foafs = React.useMemo<FoafsModel>(
      () => new FoafsModel(store),
      [store],
    )
    const suggestedActors = React.useMemo<SuggestedActorsModel>(
      () => new SuggestedActorsModel(store),
      [store],
    )
    const [searchUIModel, setSearchUIModel] = React.useState<
      SearchUIModel | undefined
    >()
    const [refreshing, setRefreshing] = React.useState(false)

    const onSoftReset = () => {
      scrollElRef.current?.scrollTo({x: 0, y: 0})
    }

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const cleanup = () => {
          softResetSub.remove()
        }

        store.shell.setMinimalShellMode(false)
        autocompleteView.setup()
        if (!foafs.hasData) {
          foafs.fetch()
        }
        if (!suggestedActors.hasLoaded) {
          suggestedActors.loadMore(true)
        }

        return cleanup
      }, [store, autocompleteView, foafs, suggestedActors]),
    )

    const onChangeQuery = React.useCallback(
      (text: string) => {
        setQuery(text)
        if (text.length > 0) {
          autocompleteView.setActive(true)
          autocompleteView.setPrefix(text)
        } else {
          autocompleteView.setActive(false)
        }
      },
      [setQuery, autocompleteView],
    )

    const onPressClearQuery = React.useCallback(() => {
      setQuery('')
    }, [setQuery])

    const onPressCancelSearch = React.useCallback(() => {
      setQuery('')
      autocompleteView.setActive(false)
      setSearchUIModel(undefined)
      store.shell.setIsDrawerSwipeDisabled(false)
    }, [setQuery, autocompleteView, store])

    const onSubmitQuery = React.useCallback(() => {
      const model = new SearchUIModel(store)
      model.fetch(query)
      setSearchUIModel(model)
      store.shell.setIsDrawerSwipeDisabled(true)
    }, [query, setSearchUIModel, store])

    const onRefresh = React.useCallback(async () => {
      setRefreshing(true)
      try {
        await foafs.fetch()
      } finally {
        setRefreshing(false)
      }
    }, [foafs, setRefreshing])

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[pal.view, styles.container]}>
          <HeaderWithInput
            isInputFocused={isInputFocused}
            query={query}
            setIsInputFocused={setIsInputFocused}
            onChangeQuery={onChangeQuery}
            onPressClearQuery={onPressClearQuery}
            onPressCancelSearch={onPressCancelSearch}
            onSubmitQuery={onSubmitQuery}
          />
          {searchUIModel ? (
            <SearchResults model={searchUIModel} />
          ) : (
            <ScrollView
              ref={scrollElRef}
              testID="searchScrollView"
              style={pal.view}
              onScroll={onMainScroll}
              scrollEventThrottle={100}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={pal.colors.text}
                  titleColor={pal.colors.text}
                />
              }>
              {query && autocompleteView.searchRes.length ? (
                <>
                  {autocompleteView.searchRes.map(item => (
                    <ProfileCard
                      key={item.did}
                      handle={item.handle}
                      displayName={item.displayName}
                      avatar={item.avatar}
                    />
                  ))}
                </>
              ) : query && !autocompleteView.searchRes.length ? (
                <View>
                  <Text style={[pal.textLight, styles.searchPrompt]}>
                    No results found for {autocompleteView.prefix}
                  </Text>
                </View>
              ) : isInputFocused ? (
                <View>
                  <Text style={[pal.textLight, styles.searchPrompt]}>
                    Search for users on the network
                  </Text>
                </View>
              ) : (
                <Suggestions foafs={foafs} suggestedActors={suggestedActors} />
              )}
              <View style={s.footerSpacer} />
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },
})
