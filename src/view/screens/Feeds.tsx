import React from 'react'
import {ActivityIndicator, StyleSheet, RefreshControl, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
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
import {SearchInput} from 'view/com/util/forms/SearchInput'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {
  LoadingPlaceholder,
  FeedFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import debounce from 'lodash.debounce'
import {Text} from 'view/com/util/text/Text'
import {MyFeedsItem} from 'state/models/ui/my-feeds'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {FlatList} from 'view/com/util/Views'
import {useFocusEffect} from '@react-navigation/native'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'

type Props = NativeStackScreenProps<FeedsTabNavigatorParams, 'Feeds'>
export const FeedsScreen = withAuthRequired(
  observer<Props>(function FeedsScreenImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
    const myFeeds = store.me.myFeeds
    const [query, setQuery] = React.useState<string>('')
    const debouncedSearchFeeds = React.useMemo(
      () => debounce(q => myFeeds.discovery.search(q), 500), // debounce for 500ms
      [myFeeds],
    )

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        myFeeds.setup()

        const softResetSub = store.onScreenSoftReset(() => myFeeds.refresh())
        return () => {
          softResetSub.remove()
        }
      }, [store, myFeeds]),
    )
    React.useEffect(() => {
      // watch for changes to saved/pinned feeds
      return myFeeds.registerListeners()
    }, [myFeeds])

    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({})
    }, [store])
    const onChangeQuery = React.useCallback(
      (text: string) => {
        setQuery(text)
        if (text.length > 1) {
          debouncedSearchFeeds(text)
        } else {
          myFeeds.discovery.refresh()
        }
      },
      [debouncedSearchFeeds, myFeeds.discovery],
    )
    const onPressCancelSearch = React.useCallback(() => {
      setQuery('')
      myFeeds.discovery.refresh()
    }, [myFeeds])
    const onSubmitQuery = React.useCallback(() => {
      debouncedSearchFeeds(query)
      debouncedSearchFeeds.flush()
    }, [debouncedSearchFeeds, query])

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

    const onRefresh = React.useCallback(() => {
      myFeeds.refresh()
    }, [myFeeds])

    const renderItem = React.useCallback(
      ({item}: {item: MyFeedsItem}) => {
        if (item.type === 'discover-feeds-loading') {
          return <FeedFeedLoadingPlaceholder />
        } else if (item.type === 'spinner') {
          return (
            <View style={s.p10}>
              <ActivityIndicator />
            </View>
          )
        } else if (item.type === 'error') {
          return <ErrorMessage message={item.error} />
        } else if (item.type === 'saved-feeds-header') {
          if (!isMobile) {
            return (
              <View
                style={[
                  pal.view,
                  styles.header,
                  pal.border,
                  {
                    borderBottomWidth: 1,
                  },
                ]}>
                <Text type="title-lg" style={[pal.text, s.bold]}>
                  My Feeds
                </Text>
                <Link
                  href="/settings/saved-feeds"
                  accessibilityLabel="Edit My Feeds"
                  accessibilityHint="">
                  <CogIcon strokeWidth={1.5} style={pal.icon} size={28} />
                </Link>
              </View>
            )
          }
          return <View />
        } else if (item.type === 'saved-feeds-loading') {
          return (
            <>
              {Array.from(Array(item.numItems)).map((_, i) => (
                <SavedFeedLoadingPlaceholder key={`placeholder-${i}`} />
              ))}
            </>
          )
        } else if (item.type === 'saved-feed') {
          return <SavedFeed feed={item.feed} />
        } else if (item.type === 'discover-feeds-header') {
          return (
            <>
              <View
                style={[
                  pal.view,
                  styles.header,
                  {
                    marginTop: 16,
                    paddingLeft: isMobile ? 12 : undefined,
                    paddingRight: 10,
                    paddingBottom: isMobile ? 6 : undefined,
                  },
                ]}>
                <Text type="title-lg" style={[pal.text, s.bold]}>
                  Discover new feeds
                </Text>
                {!isMobile && (
                  <SearchInput
                    query={query}
                    onChangeQuery={onChangeQuery}
                    onPressCancelSearch={onPressCancelSearch}
                    onSubmitQuery={onSubmitQuery}
                    style={{flex: 1, maxWidth: 250}}
                  />
                )}
              </View>
              {isMobile && (
                <View style={{paddingHorizontal: 8, paddingBottom: 10}}>
                  <SearchInput
                    query={query}
                    onChangeQuery={onChangeQuery}
                    onPressCancelSearch={onPressCancelSearch}
                    onSubmitQuery={onSubmitQuery}
                  />
                </View>
              )}
            </>
          )
        } else if (item.type === 'discover-feed') {
          return (
            <FeedSourceCard
              item={item.feed}
              showSaveBtn
              showDescription
              showLikes
            />
          )
        } else if (item.type === 'discover-feeds-no-results') {
          return (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: '150%',
              }}>
              <Text type="lg" style={pal.textLight}>
                No results found for "{query}"
              </Text>
            </View>
          )
        }
        return null
      },
      [isMobile, pal, query, onChangeQuery, onPressCancelSearch, onSubmitQuery],
    )

    return (
      <View style={[pal.view, styles.container]}>
        {isMobile && (
          <ViewHeader
            title="Feeds"
            canGoBack={false}
            renderButton={renderHeaderBtn}
            showBorder
          />
        )}

        <FlatList
          style={[!isTabletOrDesktop && s.flex1, styles.list]}
          data={myFeeds.items}
          keyExtractor={item => item._reactKey}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={myFeeds.isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={renderItem}
          initialNumToRender={10}
          onEndReached={() => myFeeds.loadMore()}
          extraData={myFeeds.isLoading}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel="New post"
          accessibilityHint=""
        />
      </View>
    )
  }),
)

function SavedFeed({feed}: {feed: FeedSourceModel}) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <Link
      testID={`saved-feed-${feed.displayName}`}
      href={feed.href}
      style={[pal.border, styles.savedFeed, isMobile && styles.savedFeedMobile]}
      hoverStyle={pal.viewLight}
      accessibilityLabel={feed.displayName}
      accessibilityHint=""
      asAnchor
      anchorNoUnderline>
      {feed.error ? (
        <View
          style={{width: 28, flexDirection: 'row', justifyContent: 'center'}}>
          <FontAwesomeIcon
            icon="exclamation-circle"
            color={pal.colors.textLight}
          />
        </View>
      ) : (
        <UserAvatar type="algo" size={28} avatar={feed.avatar} />
      )}
      <View
        style={{flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center'}}>
        <Text type="lg-medium" style={pal.text} numberOfLines={1}>
          {feed.displayName}
        </Text>
        {feed.error && (
          <View style={[styles.offlineSlug, pal.borderDark]}>
            <Text type="xs" style={pal.textLight}>
              Feed offline
            </Text>
          </View>
        )}
      </View>
      {isMobile && (
        <FontAwesomeIcon
          icon="chevron-right"
          size={14}
          style={pal.textLight as FontAwesomeIconStyle}
        />
      )}
    </Link>
  )
}

function SavedFeedLoadingPlaceholder() {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <View
      style={[
        pal.border,
        styles.savedFeed,
        isMobile && styles.savedFeedMobile,
      ]}>
      <LoadingPlaceholder width={28} height={28} style={{borderRadius: 4}} />
      <LoadingPlaceholder width={140} height={12} />
    </View>
  )
}

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  savedFeed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  savedFeedMobile: {
    paddingVertical: 10,
  },
  offlineSlug: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
})
