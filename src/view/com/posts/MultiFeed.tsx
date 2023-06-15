import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {PostsMultiFeedModel, MultiFeedItem} from 'state/models/feeds/multi-feed'
import {FeedSlice} from './FeedSlice'
import {Text} from '../util/text/Text'
import {Link} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {isDesktopWeb} from 'platform/detection'
import {CogIcon} from 'lib/icons'

export const MultiFeed = observer(function Feed({
  multifeed,
  style,
  showPostFollowBtn,
  scrollElRef,
  onScroll,
  scrollEventThrottle,
  testID,
  headerOffset = 0,
  extraData,
}: {
  multifeed: PostsMultiFeedModel
  style?: StyleProp<ViewStyle>
  showPostFollowBtn?: boolean
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  scrollEventThrottle?: number
  renderEmptyState?: () => JSX.Element
  testID?: string
  headerOffset?: number
  extraData?: any
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('MultiFeed:onRefresh')
    setIsRefreshing(true)
    try {
      await multifeed.refresh()
    } catch (err) {
      multifeed.rootStore.log.error('Failed to refresh posts feed', err)
    }
    setIsRefreshing(false)
  }, [multifeed, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    track('MultiFeed:onEndReached')
    try {
      await multifeed.loadMore()
    } catch (err) {
      multifeed.rootStore.log.error('Failed to load more posts', err)
    }
  }, [multifeed, track])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: MultiFeedItem}) => {
      if (item.type === 'header') {
        if (isDesktopWeb) {
          return (
            <View style={[pal.view, pal.border, styles.headerDesktop]}>
              <Text type="2xl-bold" style={pal.text}>
                My Feeds
              </Text>
              <Link href="/settings/saved-feeds">
                <CogIcon strokeWidth={1.5} style={pal.icon} size={28} />
              </Link>
            </View>
          )
        }
        return <View style={[styles.header, pal.border]} />
      } else if (item.type === 'feed-header') {
        return (
          <View style={styles.feedHeader}>
            <UserAvatar type="algo" avatar={item.avatar} size={28} />
            <Text type="title-lg" style={[pal.text, styles.feedHeaderTitle]}>
              {item.title}
            </Text>
          </View>
        )
      } else if (item.type === 'feed-slice') {
        return (
          <FeedSlice slice={item.slice} showFollowBtn={showPostFollowBtn} />
        )
      } else if (item.type === 'feed-loading') {
        return <PostFeedLoadingPlaceholder />
      } else if (item.type === 'feed-error') {
        return <ErrorMessage message={item.error} />
      } else if (item.type === 'feed-footer') {
        return (
          <Link
            href={item.uri}
            style={[styles.feedFooter, pal.border, pal.view]}>
            <Text type="lg" style={pal.link}>
              See more from {item.title}
            </Text>
            <FontAwesomeIcon
              icon="angle-right"
              size={18}
              color={pal.colors.link}
            />
          </Link>
        )
      } else if (item.type === 'footer') {
        return (
          <Link style={[styles.footerLink, pal.viewLight]} href="/search/feeds">
            <FontAwesomeIcon icon="search" size={18} color={pal.colors.text} />
            <Text type="xl-medium" style={pal.text}>
              Discover new feeds
            </Text>
          </Link>
        )
      }
      return null
    },
    [showPostFollowBtn, pal],
  )

  const FeedFooter = React.useCallback(
    () =>
      multifeed.isLoading && !isRefreshing ? (
        <View style={styles.loadMore}>
          <ActivityIndicator color={pal.colors.text} />
        </View>
      ) : (
        <View />
      ),
    [multifeed.isLoading, isRefreshing, pal],
  )

  return (
    <View testID={testID} style={style}>
      {multifeed.items.length > 0 && (
        <FlatList
          testID={testID ? `${testID}-flatlist` : undefined}
          ref={scrollElRef}
          data={multifeed.items}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
              progressViewOffset={headerOffset}
            />
          }
          contentContainerStyle={s.contentContainer}
          style={[{paddingTop: headerOffset}, pal.view, styles.container]}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          removeClippedSubviews={true}
          contentOffset={{x: 0, y: headerOffset * -1}}
          extraData={extraData}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  header: {
    borderTopWidth: 1,
    marginBottom: 4,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  feedHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 12,
  },
  feedHeaderTitle: {
    fontWeight: 'bold',
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 8,
  },
  loadMore: {
    paddingTop: 10,
  },
})
