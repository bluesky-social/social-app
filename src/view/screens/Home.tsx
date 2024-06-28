import React from 'react'
import {ActivityIndicator, AppState, StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {logEvent, LogEvents} from '#/lib/statsig/statsig'
import {emitSoftReset} from '#/state/events'
import {SavedFeedSourceInfo, usePinnedFeedsInfos} from '#/state/queries/feed'
import {FeedParams} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSession} from '#/state/session'
import {
  useMinimalShellMode,
  useSetDrawerSwipeDisabled,
  useSetMinimalShellMode,
} from '#/state/shell'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {useOTAUpdates} from 'lib/hooks/useOTAUpdates'
import {useRequestNotificationsPermission} from 'lib/notifications/notifications'
import {HomeTabNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {FeedPage} from 'view/com/feeds/FeedPage'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {NoFeedsPinned} from '#/screens/Home/NoFeedsPinned'
import {TOURS, useTriggerTourIfQueued} from '#/tours'
import {HomeHeader} from '../com/home/HomeHeader'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home' | 'Start'>
export function HomeScreen(props: Props) {
  const {data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()
  const {data: pinnedFeedInfos, isLoading: isPinnedFeedsLoading} =
    usePinnedFeedsInfos()

  React.useEffect(() => {
    const params = props.route.params
    if (
      currentAccount &&
      props.route.name === 'Start' &&
      params?.name &&
      params?.rkey
    ) {
      props.navigation.navigate('StarterPack', {
        rkey: params.rkey,
        name: params.name,
      })
    }
  }, [currentAccount, props.navigation, props.route.name, props.route.params])

  if (preferences && pinnedFeedInfos && !isPinnedFeedsLoading) {
    return (
      <HomeScreenReady
        {...props}
        preferences={preferences}
        pinnedFeedInfos={pinnedFeedInfos}
      />
    )
  } else {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}

function HomeScreenReady({
  preferences,
  pinnedFeedInfos,
}: Props & {
  preferences: UsePreferencesQueryResponse
  pinnedFeedInfos: SavedFeedSourceInfo[]
}) {
  const allFeeds = React.useMemo(
    () => pinnedFeedInfos.map(f => f.feedDescriptor),
    [pinnedFeedInfos],
  )
  const rawSelectedFeed = useSelectedFeed() ?? allFeeds[0]
  const setSelectedFeed = useSetSelectedFeed()
  const maybeFoundIndex = allFeeds.indexOf(rawSelectedFeed)
  const selectedIndex = Math.max(0, maybeFoundIndex)
  const selectedFeed = allFeeds[selectedIndex]
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const triggerTourIfQueued = useTriggerTourIfQueued(TOURS.HOME)

  useSetTitle(pinnedFeedInfos[selectedIndex]?.displayName)
  useOTAUpdates()

  React.useEffect(() => {
    requestNotificationsPermission('Home')
  }, [requestNotificationsPermission])

  const pagerRef = React.useRef<PagerRef>(null)
  const lastPagerReportedIndexRef = React.useRef(selectedIndex)
  React.useLayoutEffect(() => {
    // Since the pager is not a controlled component, adjust it imperatively
    // if the selected index gets out of sync with what it last reported.
    // This is supposed to only happen on the web when you use the right nav.
    if (selectedIndex !== lastPagerReportedIndexRef.current) {
      lastPagerReportedIndexRef.current = selectedIndex
      pagerRef.current?.setPage(selectedIndex, 'desktop-sidebar-click')
    }
  }, [selectedIndex])

  const {hasSession} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(selectedIndex > 0)
      triggerTourIfQueued()
      return () => {
        setDrawerSwipeDisabled(false)
      }
    }, [
      setDrawerSwipeDisabled,
      selectedIndex,
      setMinimalShellMode,
      triggerTourIfQueued,
    ]),
  )

  useFocusEffect(
    useNonReactiveCallback(() => {
      if (selectedFeed) {
        logEvent('home:feedDisplayed:sampled', {
          index: selectedIndex,
          feedType: selectedFeed.split('|')[0],
          feedUrl: selectedFeed,
          reason: 'focus',
        })
      }
    }),
  )

  const mode = useMinimalShellMode()
  const {isMobile} = useWebMediaQueries()
  useFocusEffect(
    React.useCallback(() => {
      const listener = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          if (isMobile && mode.value === 1) {
            // Reveal the bottom bar so you don't miss notifications or messages.
            // TODO: Experiment with only doing it when unread > 0.
            setMinimalShellMode(false)
          }
        }
      })
      return () => {
        listener.remove()
      }
    }, [setMinimalShellMode, mode, isMobile]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(index > 0)
      const feed = allFeeds[index]
      setSelectedFeed(feed)
      lastPagerReportedIndexRef.current = index
    },
    [setDrawerSwipeDisabled, setSelectedFeed, setMinimalShellMode, allFeeds],
  )

  const onPageSelecting = React.useCallback(
    (
      index: number,
      reason: LogEvents['home:feedDisplayed:sampled']['reason'],
    ) => {
      const feed = allFeeds[index]
      logEvent('home:feedDisplayed:sampled', {
        index,
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason,
      })
    },
    [allFeeds],
  )

  const onPressSelected = React.useCallback(() => {
    emitSoftReset()
  }, [])

  const onPageScrollStateChanged = React.useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      if (state === 'dragging') {
        setMinimalShellMode(false)
      }
    },
    [setMinimalShellMode],
  )

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <HomeHeader
          key="FEEDS_TAB_BAR"
          {...props}
          testID="homeScreenFeedTabs"
          onPressSelected={onPressSelected}
          feeds={pinnedFeedInfos}
        />
      )
    },
    [onPressSelected, pinnedFeedInfos],
  )

  const renderFollowingEmptyState = React.useCallback(() => {
    return <FollowingEmptyState />
  }, [])

  const renderCustomFeedEmptyState = React.useCallback(() => {
    return <CustomFeedEmptyState />
  }, [])

  const homeFeedParams = React.useMemo<FeedParams>(() => {
    return {
      mergeFeedEnabled: Boolean(preferences.feedViewPrefs.lab_mergeFeedEnabled),
      mergeFeedSources: preferences.feedViewPrefs.lab_mergeFeedEnabled
        ? preferences.savedFeeds
            .filter(f => f.type === 'feed' || f.type === 'list')
            .map(f => f.value)
        : [],
    }
  }, [preferences])

  return hasSession ? (
    <Pager
      key={allFeeds.join(',')}
      ref={pagerRef}
      testID="homeScreen"
      initialPage={selectedIndex}
      onPageSelecting={onPageSelecting}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}>
      {pinnedFeedInfos.length ? (
        pinnedFeedInfos.map(feedInfo => {
          const feed = feedInfo.feedDescriptor
          if (feed === 'following') {
            return (
              <FeedPage
                key={feed}
                testID="followingFeedPage"
                isPageFocused={selectedFeed === feed}
                feed={feed}
                feedParams={homeFeedParams}
                renderEmptyState={renderFollowingEmptyState}
                renderEndOfFeed={FollowingEndOfFeed}
              />
            )
          }
          const savedFeedConfig = feedInfo.savedFeed
          return (
            <FeedPage
              key={feed}
              testID="customFeedPage"
              isPageFocused={selectedFeed === feed}
              feed={feed}
              renderEmptyState={renderCustomFeedEmptyState}
              savedFeedConfig={savedFeedConfig}
            />
          )
        })
      ) : (
        <NoFeedsPinned preferences={preferences} />
      )}
    </Pager>
  ) : (
    <Pager
      testID="homeScreen"
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}>
      <FeedPage
        testID="customFeedPage"
        isPageFocused
        feed={`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`}
        renderEmptyState={renderCustomFeedEmptyState}
      />
    </Pager>
  )
}

const styles = StyleSheet.create({
  loading: {
    height: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
})
