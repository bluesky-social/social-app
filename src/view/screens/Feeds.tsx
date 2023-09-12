import React from 'react'
import {StyleSheet, RefreshControl, View} from 'react-native'
import {AtUri} from '@atproto/api'
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
import {PostFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import debounce from 'lodash.debounce'
import {Text} from 'view/com/util/text/Text'
import {MyFeedsUIModel, MyFeedsItem} from 'state/models/ui/my-feeds'
import {FlatList} from 'view/com/util/Views'
import {useFocusEffect} from '@react-navigation/native'
import {CustomFeed} from 'view/com/feeds/CustomFeed'

type Props = NativeStackScreenProps<FeedsTabNavigatorParams, 'Feeds'>
export const FeedsScreen = withAuthRequired(
  observer<Props>(function FeedsScreenImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
    const myFeeds = React.useMemo(() => new MyFeedsUIModel(store), [store])
    const [query, setQuery] = React.useState<string>('')
    const debouncedSearchFeeds = React.useMemo(
      () => debounce(q => myFeeds.discovery.search(q), 500), // debounce for 500ms
      [myFeeds],
    )

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        myFeeds.setup()
      }, [store.shell, myFeeds]),
    )

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
        if (item.type === 'loading') {
          return <PostFeedLoadingPlaceholder />
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
                <Link href="/settings/saved-feeds">
                  <CogIcon strokeWidth={1.5} style={pal.icon} size={28} />
                </Link>
              </View>
            )
          }
          return <View />
        } else if (item.type === 'saved-feed') {
          return (
            <SavedFeed
              uri={item.feed.uri}
              avatar={item.feed.data.avatar}
              displayName={item.feed.displayName}
            />
          )
        } else if (item.type === 'discover-feeds-header') {
          return (
            <View
              style={[
                pal.view,
                styles.header,
                {marginTop: 16, paddingRight: 10},
              ]}>
              <Text type="title-lg" style={[pal.text, s.bold]}>
                Discover new feeds
              </Text>
              <View style={{flex: 1, maxWidth: 250}}>
                <SearchInput
                  query={query}
                  onChangeQuery={onChangeQuery}
                  onPressCancelSearch={onPressCancelSearch}
                  onSubmitQuery={onSubmitQuery}
                />
              </View>
            </View>
          )
        } else if (item.type === 'discover-feed') {
          return (
            <CustomFeed
              item={item.feed}
              showSaveBtn
              showDescription
              showLikes
            />
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
            title="My Feeds"
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

function SavedFeed({
  uri,
  avatar,
  displayName,
}: {
  uri: string
  avatar: string
  displayName: string
}) {
  const pal = usePalette('default')
  const urip = new AtUri(uri)
  const href = `/profile/${urip.hostname}/feed/${urip.rkey}`
  return (
    <Link
      testID={`saved-feed-${displayName}`}
      href={href}
      style={[pal.border, styles.savedFeed]}
      hoverStyle={pal.viewLight}
      accessibilityLabel={displayName}
      accessibilityHint=""
      asAnchor
      anchorNoUnderline>
      <UserAvatar type="algo" size={28} avatar={avatar} />
      <Text type="lg-medium" style={pal.text} numberOfLines={1}>
        {displayName}
      </Text>
    </Link>
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
})
