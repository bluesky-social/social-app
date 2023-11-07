import React, {useCallback} from 'react'
import {
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {FlatList, ScrollView} from 'view/com/util/Views'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
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
import {isAndroid, isIOS} from 'platform/detection'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer<Props>(function SearchScreenImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const setMinimalShellMode = useSetMinimalShellMode()
    const setIsDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
    const scrollViewRef = React.useRef<ScrollView>(null)
    const flatListRef = React.useRef<FlatList>(null)
    const [onMainScroll] = useOnMainScroll()
    const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
    const [query, setQuery] = React.useState<string>('')
    const autocompleteView = React.useMemo<UserAutocompleteModel>(
      () => new UserAutocompleteModel(store),
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
      setIsDrawerSwipeDisabled(false)
    }, [setQuery, autocompleteView, setIsDrawerSwipeDisabled])

    const onSubmitQuery = React.useCallback(() => {
      if (query.length === 0) {
        return
      }

      const model = new SearchUIModel(store)
      model.fetch(query)
      setSearchUIModel(model)
      setIsDrawerSwipeDisabled(true)
    }, [query, setSearchUIModel, store, setIsDrawerSwipeDisabled])

    const onSoftReset = React.useCallback(() => {
      scrollViewRef.current?.scrollTo({x: 0, y: 0})
      flatListRef.current?.scrollToOffset({offset: 0})
      onPressCancelSearch()
    }, [scrollViewRef, flatListRef, onPressCancelSearch])

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const cleanup = () => {
          softResetSub.remove()
        }

        setMinimalShellMode(false)
        autocompleteView.setup()
        if (!foafs.hasData) {
          foafs.fetch()
        }
        if (!suggestedActors.hasLoaded) {
          suggestedActors.loadMore(true)
        }

        return cleanup
      }, [
        store,
        autocompleteView,
        foafs,
        suggestedActors,
        onSoftReset,
        setMinimalShellMode,
      ]),
    )

    const onPress = useCallback(() => {
      if (isIOS || isAndroid) {
        Keyboard.dismiss()
      }
    }, [])

    return (
      <TouchableWithoutFeedback onPress={onPress} accessible={false}>
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
          ) : !isInputFocused && !query ? (
            <Suggestions
              ref={flatListRef}
              foafs={foafs}
              suggestedActors={suggestedActors}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              testID="searchScrollView"
              style={pal.view}
              onScroll={onMainScroll}
              scrollEventThrottle={100}>
              {query && autocompleteView.suggestions.length ? (
                <>
                  {autocompleteView.suggestions.map((suggestion, index) => (
                    <ProfileCard
                      key={suggestion.did}
                      testID={`searchAutoCompleteResult-${suggestion.handle}`}
                      profile={suggestion}
                      noBorder={index === 0}
                    />
                  ))}
                </>
              ) : query && !autocompleteView.suggestions.length ? (
                <View>
                  <Text style={[pal.textLight, styles.searchPrompt]}>
                    No results found for {autocompleteView.prefix}
                  </Text>
                </View>
              ) : isInputFocused ? (
                <View>
                  <Text style={[pal.textLight, styles.searchPrompt]}>
                    Search for users and posts on the network
                  </Text>
                </View>
              ) : null}
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
