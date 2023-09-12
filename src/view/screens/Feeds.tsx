import React from 'react'
import {StyleSheet, RefreshControl, View, Pressable} from 'react-native'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {FAB} from 'view/com/util/fab/FAB'
import {Link} from 'view/com/util/Link'
import {NativeStackScreenProps, FeedsTabNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2, CogIcon} from 'lib/icons'
import {s} from 'lib/styles'
import {CenteredView} from 'view/com/util/Views'
import {HeaderWithInput} from 'view/com/search/HeaderWithInput'
import debounce from 'lodash.debounce'
import {Text} from 'view/com/util/text/Text'
import {FeedsDiscoveryModel} from 'state/models/discovery/feeds'
import {FlatList} from 'view/com/util/Views'
import {useFocusEffect} from '@react-navigation/native'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'

type Props = NativeStackScreenProps<FeedsTabNavigatorParams, 'Feeds'>
export const FeedsScreen = withAuthRequired(
  observer<Props>(function FeedsScreenImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {isTabletOrDesktop} = useWebMediaQueries()
    const feeds = React.useMemo(() => new FeedsDiscoveryModel(store), [store])
    const savedFeeds = React.useMemo(() => store.me.savedFeeds, [store])

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        if (!feeds.hasLoaded) {
          feeds.refresh()
        }
        if (!savedFeeds.hasLoaded) {
          savedFeeds.refresh()
        }
      }, [store.shell, feeds, savedFeeds]),
    )

    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({})
    }, [store])

    const renderHeaderBtn = React.useCallback(() => {
      return (
        <Link
          href="/settings/saved-feeds"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Edit Saved Feeds"
          accessibilityHint="Opens screen to edit Saved Feeds">
          <CogIcon size={22} strokeWidth={2} style={pal.textLight} />
        </Link>
      )
    }, [pal])

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

    const ListHeaderComponent = React.useCallback(() => {
      return (
        <>
          {!savedFeeds.isEmpty ? (
            <>
              <Text style={[pal.text, styles.subHeading]}>Saved Feeds</Text>
              {savedFeeds.top5.map(f => {
                return (
                  <CustomFeed
                    key={f.data.uri}
                    item={f}
                    showSaveBtn
                    style={styles.savedFeed}
                  />
                )
              })}
              <Pressable
                accessibilityRole="button"
                style={styles.loadMore}
                onPress={() => {
                  // TODO: expand to full list
                }}>
                <Text type="md-medium" style={[pal.text, pal.link]}>
                  Load more...
                </Text>
              </Pressable>
            </>
          ) : null}

          <Text style={[pal.text, styles.subHeading]}>Discover new Feeds</Text>
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
        </>
      )
    }, [
      isInputFocused,
      onChangeQuery,
      onPressCancelSearch,
      onPressClearQuery,
      onSubmitQuery,
      pal.link,
      pal.text,
      query,
      savedFeeds.isEmpty,
      savedFeeds.top5,
    ])

    return (
      <CenteredView style={[pal.view, styles.container]}>
        <ViewHeader
          title="My Feeds"
          canGoBack={false}
          renderButton={renderHeaderBtn}
          showBorder
        />

        <FlatList
          ListHeaderComponent={ListHeaderComponent}
          style={[!isTabletOrDesktop && s.flex1, styles.list]}
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
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel="New post"
          accessibilityHint=""
        />
      </CenteredView>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    height: '100%',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  empty: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  subHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingLeft: 16,
    paddingTop: 16,
  },
  savedFeed: {
    borderTopWidth: 0,
  },
  loadMore: {
    alignSelf: 'flex-end',
    paddingRight: 16,
  },
})
