import React from 'react'
import {RefreshControl, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from 'state/index'
import {FeedsDiscoveryModel} from 'state/models/discovery/feeds'
import {CenteredView, FlatList} from 'view/com/util/Views'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s} from 'lib/styles'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {HeaderWithInput} from 'view/com/search/HeaderWithInput'
import debounce from 'lodash.debounce'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DiscoverFeeds'>
export const DiscoverFeedsScreen = withAuthRequired(
  observer(function DiscoverFeedsScreenImpl({}: Props) {
    const store = useStores()
    const pal = usePalette('default')
    const feeds = React.useMemo(() => new FeedsDiscoveryModel(store), [store])
    const {isTabletOrDesktop} = useWebMediaQueries()

    // search stuff
    const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
    const [query, setQuery] = React.useState<string>('')
    const debouncedSearchFeeds = React.useMemo(
      () => debounce(q => feeds.search(q), 500), // debounce for 500ms
      [feeds],
    )
    const onChangeQuery = React.useCallback(
      (text: string) => {
        setQuery(text)
        if (text.length > 1) {
          debouncedSearchFeeds(text)
        } else {
          feeds.refresh()
        }
      },
      [debouncedSearchFeeds, feeds],
    )
    const onPressClearQuery = React.useCallback(() => {
      setQuery('')
      feeds.refresh()
    }, [feeds])
    const onPressCancelSearch = React.useCallback(() => {
      setIsInputFocused(false)
      setQuery('')
      feeds.refresh()
    }, [feeds])
    const onSubmitQuery = React.useCallback(() => {
      debouncedSearchFeeds(query)
      debouncedSearchFeeds.flush()
    }, [debouncedSearchFeeds, query])

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        if (!feeds.hasLoaded) {
          feeds.refresh()
        }
      }, [store, feeds]),
    )

    const onRefresh = React.useCallback(() => {
      feeds.refresh()
    }, [feeds])

    const renderListEmptyComponent = () => {
      return (
        <View style={styles.empty}>
          <Text type="lg" style={pal.textLight}>
            {feeds.isLoading
              ? isTabletOrDesktop
                ? 'Loading...'
                : ''
              : query
              ? `No results found for "${query}"`
              : `We can't find any feeds for some reason. This is probably an error - try refreshing!`}
          </Text>
        </View>
      )
    }

    const renderItem = React.useCallback(
      ({item}: {item: CustomFeedModel}) => (
        <CustomFeed
          key={item.data.uri}
          item={item}
          showSaveBtn
          showDescription
          showLikes
        />
      ),
      [],
    )

    return (
      <CenteredView style={[styles.container, pal.view]}>
        <View
          style={[isTabletOrDesktop && styles.containerDesktop, pal.border]}>
          <ViewHeader title="Discover Feeds" showOnDesktop />
        </View>
        <HeaderWithInput
          isInputFocused={isInputFocused}
          query={query}
          setIsInputFocused={setIsInputFocused}
          onChangeQuery={onChangeQuery}
          onPressClearQuery={onPressClearQuery}
          onPressCancelSearch={onPressCancelSearch}
          onSubmitQuery={onSubmitQuery}
          showMenu={false}
        />
        <FlatList
          style={[!isTabletOrDesktop && s.flex1]}
          data={feeds.feeds}
          keyExtractor={item => item.data.uri}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={feeds.isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={renderItem}
          initialNumToRender={10}
          ListEmptyComponent={renderListEmptyComponent}
          onEndReached={() => feeds.loadMore()}
          extraData={feeds.isLoading}
        />
      </CenteredView>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  empty: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
})
