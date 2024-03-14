import React from 'react'
import {View, ActivityIndicator, StyleSheet} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {HomeHeader} from '../com/home/HomeHeader'
import {Pager, RenderTabBarFnProps, PagerRef} from 'view/com/pager/Pager'
import {FeedPage} from 'view/com/feeds/FeedPage'
import {HomeLoggedOutCTA} from '../com/auth/HomeLoggedOutCTA'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {usePinnedFeedsInfos, FeedSourceInfo} from '#/state/queries/feed'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {useSetTitle} from '#/lib/hooks/useSetTitle'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export function HomeScreen(props: Props) {
  const {data: preferences} = usePreferencesQuery()
  const {data: pinnedFeedInfos, isLoading: isPinnedFeedsLoading} =
    usePinnedFeedsInfos()
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
  pinnedFeedInfos: FeedSourceInfo[]
}) {
  const allFeeds = React.useMemo(() => {
    const feeds: FeedDescriptor[] = []
    feeds.push('home')
    for (const {uri} of pinnedFeedInfos) {
      if (uri.includes('app.bsky.feed.generator')) {
        feeds.push(`feedgen|${uri}`)
      } else if (uri.includes('app.bsky.graph.list')) {
        feeds.push(`list|${uri}`)
      }
    }
    return feeds
  }, [pinnedFeedInfos])

  const rawSelectedFeed = useSelectedFeed()
  const setSelectedFeed = useSetSelectedFeed()
  const maybeFoundIndex = allFeeds.indexOf(rawSelectedFeed as FeedDescriptor)
  const selectedIndex = Math.max(0, maybeFoundIndex)
  const selectedFeed = allFeeds[selectedIndex]

  useSetTitle(pinnedFeedInfos[selectedIndex]?.displayName)

  const pagerRef = React.useRef<PagerRef>(null)
  const lastPagerReportedIndexRef = React.useRef(selectedIndex)
  React.useLayoutEffect(() => {
    // Since the pager is not a controlled component, adjust it imperatively
    // if the selected index gets out of sync with what it last reported.
    // This is supposed to only happen on the web when you use the right nav.
    if (selectedIndex !== lastPagerReportedIndexRef.current) {
      lastPagerReportedIndexRef.current = selectedIndex
      pagerRef.current?.setPage(selectedIndex)
    }
  }, [selectedIndex])

  const {hasSession} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(selectedIndex > 0)
      return () => {
        setDrawerSwipeDisabled(false)
      }
    }, [setDrawerSwipeDisabled, selectedIndex, setMinimalShellMode]),
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

  const [homeFeed, ...customFeeds] = allFeeds
  const homeFeedParams = React.useMemo<FeedParams>(() => {
    return {
      mergeFeedEnabled: Boolean(preferences.feedViewPrefs.lab_mergeFeedEnabled),
      mergeFeedSources: preferences.feedViewPrefs.lab_mergeFeedEnabled
        ? preferences.feeds.saved
        : [],
    }
  }, [preferences])

  return hasSession ? (
    <Pager
      key={allFeeds.join(',')}
      ref={pagerRef}
      testID="homeScreen"
      initialPage={selectedIndex}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}>
      <FeedPage
        key={homeFeed}
        testID="followingFeedPage"
        isPageFocused={selectedFeed === homeFeed}
        feed={homeFeed}
        feedParams={homeFeedParams}
        renderEmptyState={renderFollowingEmptyState}
        renderEndOfFeed={FollowingEndOfFeed}
      />
      {customFeeds.map(feed => {
        return (
          <FeedPage
            key={feed}
            testID="customFeedPage"
            isPageFocused={selectedFeed === feed}
            feed={feed}
            renderEmptyState={renderCustomFeedEmptyState}
          />
        )
      })}
    </Pager>
  ) : (
    <Pager
      testID="homeScreen"
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}>
      <HomeLoggedOutCTA />
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
