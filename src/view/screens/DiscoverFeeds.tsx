import React from 'react'
import {RefreshControl, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useStores} from 'state/index'
import {FeedsDiscoveryModel} from 'state/models/discovery/feeds'
import {CenteredView, FlatList} from 'view/com/util/Views'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {HeaderWithInput} from 'view/com/search/HeaderWithInput'
import debounce from 'lodash.debounce'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {OnboardingNavigatorParams} from 'view/com/modals/OnboardingModal'

type DiscoverFeedsScreenProps = NativeStackScreenProps<
  CommonNavigatorParams | OnboardingNavigatorParams,
  'DiscoverFeeds'
>
export const DiscoverFeedsScreen = withAuthRequired(
  observer(({navigation}: DiscoverFeedsScreenProps) => {
    return (
      <DiscoverFeedsComponent
        onPressBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          }
        }}
      />
    )
  }),
)

type DiscoverFeedsComponentProps = {
  onPressBack?: () => void
}
export const DiscoverFeedsComponent = observer(
  ({onPressBack}: DiscoverFeedsComponentProps) => {
    const store = useStores()
    const pal = usePalette('default')
    const feeds = React.useMemo(() => new FeedsDiscoveryModel(store), [store])

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
        feeds.refresh()
      }, [store, feeds]),
    )

    const onRefresh = React.useCallback(() => {
      feeds.refresh()
    }, [feeds])

    const renderListEmptyComponent = React.useCallback(() => {
      return (
        <View
          style={[
            pal.border,
            !isDesktopWeb && s.flex1,
            pal.viewLight,
            styles.empty,
          ]}>
          <Text type="lg" style={[pal.text]}>
            {feeds.isLoading
              ? 'Loading...'
              : `We can't find any feeds for some reason. This is probably an error - try refreshing!`}
          </Text>
        </View>
      )
    }, [pal, feeds.isLoading])

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
        <View style={[isDesktopWeb && styles.containerDesktop, pal.border]}>
          <View style={styles.header}>
            {onPressBack ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onPressBack}
                style={styles.backBtn}>
                <FontAwesomeIcon
                  size={18}
                  icon="angle-left"
                  style={[styles.backIcon, pal.text]}
                />
              </TouchableOpacity>
            ) : null}
            <Text type="title" style={[pal.text, styles.title]}>
              Discover Feeds
            </Text>
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
        </View>
        <FlatList
          style={[!isDesktopWeb && s.flex1]}
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
  },
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 18,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    paddingBottom: 8,
  },
  backBtn: {
    width: 30,
    height: 30,
    position: 'absolute',
    left: 8,
    bottom: 4,
  },
  backIcon: {
    marginTop: 6,
  },
})
