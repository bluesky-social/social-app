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
import {HeaderWithInput} from 'view/com/search/HeaderWithInput'
import {Suggestions} from 'view/com/search/Suggestions'
import {FoafsModel} from 'state/models/discovery/foafs'
import {s} from 'lib/styles'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {usePalette} from 'lib/hooks/usePalette'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'

const FIVE_MIN = 5 * 60 * 1e3

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer<Props>(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const scrollElRef = React.useRef<ScrollView>(null)
    const onMainScroll = useOnMainScroll(store)
    const [lastRenderTime, setRenderTime] = React.useState<number>(Date.now()) // used to trigger reloads
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

        const now = Date.now()
        if (now - lastRenderTime > FIVE_MIN) {
          setRenderTime(Date.now()) // trigger reload of suggestions
        }
        store.shell.setMinimalShellMode(false)
        autocompleteView.setup()
        if (!foafs.hasData) {
          foafs.fetch()
        }

        return cleanup
      }, [store, autocompleteView, foafs, lastRenderTime, setRenderTime]),
    )

    const onChangeQuery = (text: string) => {
      setQuery(text)
      if (text.length > 0) {
        autocompleteView.setActive(true)
        autocompleteView.setPrefix(text)
      } else {
        autocompleteView.setActive(false)
      }
    }
    const onPressClearQuery = () => {
      setQuery('')
    }
    const onPressCancelSearch = () => {
      setQuery('')
      autocompleteView.setActive(false)
    }
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
          />
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
              <Suggestions foafs={foafs} />
            )}
            <View style={s.footerSpacer} />
          </ScrollView>
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
