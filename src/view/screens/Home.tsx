import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {withSpring} from 'react-native-reanimated'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useOTAUpdates} from '#/lib/hooks/useOTAUpdates'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {
  type HomeTabNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {
  type SavedFeedSourceInfo,
  usePinnedFeedsInfos,
} from '#/state/queries/feed'
import {type FeedDescriptor, type FeedParams} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {FeedPage} from '#/view/com/feeds/FeedPage'
import {HomeHeader} from '#/view/com/home/HomeHeader'
import {
  Pager,
  type PagerRef,
  type RenderTabBarFnProps,
} from '#/view/com/pager/Pager'
import {CustomFeedEmptyState} from '#/view/com/posts/CustomFeedEmptyState'
import {FollowingEmptyState} from '#/view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from '#/view/com/posts/FollowingEndOfFeed'
import {
  HomeHeaderModeProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {NoFeedsPinned} from '#/screens/Home/NoFeedsPinned'
import {Explore} from '#/screens/Search/Explore'
import {useTheme} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'
import {useDemoMode} from '#/storage/hooks/demo-mode'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home' | 'Start'>
export function HomeScreen(props: Props) {
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const {data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()
  const {data: pinnedFeedInfos, isLoading: isPinnedFeedsLoading} =
    usePinnedFeedsInfos()
  const setSelectedFeed = useSetSelectedFeed()

  // Inline "Discover new feeds" (Explore) state lives here rather than in
  // HomeScreenReady because pinning a feed changes the usePinnedFeedsInfos query
  // key, which briefly unmounts HomeScreenReady -- losing any state held there.
  const [showExplore, setShowExplore] = useState(false)
  const prevPinnedCountRef = useRef(0)
  useEffect(() => {
    if (!pinnedFeedInfos) return
    const prevCount = prevPinnedCountRef.current
    prevPinnedCountRef.current = pinnedFeedInfos.length
    // When a custom feed is pinned while Explore is open, select the last pinned
    // custom feed (the rightmost non-Following tab) and close Explore.
    if (showExplore && prevCount > 0 && pinnedFeedInfos.length > prevCount) {
      let lastCustomIndex = -1
      for (let i = 0; i < pinnedFeedInfos.length; i++) {
        if (pinnedFeedInfos[i].feedDescriptor !== 'following') {
          lastCustomIndex = i
        }
      }
      if (lastCustomIndex !== -1) {
        setSelectedFeed(pinnedFeedInfos[lastCustomIndex].feedDescriptor)
      }
      setShowExplore(false)
    }
  }, [pinnedFeedInfos, showExplore, setSelectedFeed])

  useEffect(() => {
    if (IS_WEB && !currentAccount) {
      const getParams = new URLSearchParams(window.location.search)
      const splash = getParams.get('splash')
      if (splash === 'true') {
        setShowLoggedOut(true)
        return
      }
    }

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
  }, [
    currentAccount,
    props.navigation,
    props.route.name,
    props.route.params,
    setShowLoggedOut,
  ])

  if (preferences && pinnedFeedInfos && !isPinnedFeedsLoading) {
    return (
      <Layout.Screen testID="HomeScreen" noInsetTop={IS_LIQUID_GLASS}>
        <HomeHeaderModeProvider>
          <HomeScreenReady
            {...props}
            preferences={preferences}
            pinnedFeedInfos={pinnedFeedInfos}
            showExplore={showExplore}
            setShowExplore={setShowExplore}
          />
        </HomeHeaderModeProvider>
      </Layout.Screen>
    )
  } else {
    return (
      <Layout.Screen>
        <Layout.Center style={styles.loading}>
          <ActivityIndicator size="large" />
        </Layout.Center>
      </Layout.Screen>
    )
  }
}

function HomeScreenReady({
  preferences,
  pinnedFeedInfos,
  showExplore,
  setShowExplore,
}: Props & {
  preferences: UsePreferencesQueryResponse
  pinnedFeedInfos: SavedFeedSourceInfo[]
  showExplore: boolean
  setShowExplore: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const ax = useAnalytics()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const headerOffset = useHeaderOffset()
  const allFeeds = useMemo(
    () => pinnedFeedInfos.map(f => f.feedDescriptor),
    [pinnedFeedInfos],
  )
  const maybeRawSelectedFeed: FeedDescriptor | undefined =
    useSelectedFeed() ?? allFeeds[0]
  const setSelectedFeed = useSetSelectedFeed()
  const maybeFoundIndex = allFeeds.indexOf(maybeRawSelectedFeed)
  const selectedIndex = Math.max(0, maybeFoundIndex)
  const maybeSelectedFeed: FeedDescriptor | undefined = allFeeds[selectedIndex]
  const requestNotificationsPermission = useRequestNotificationsPermission()

  useSetTitle(pinnedFeedInfos[selectedIndex]?.displayName)
  useOTAUpdates()

  useEffect(() => {
    requestNotificationsPermission('Home')
  }, [requestNotificationsPermission])

  const pagerRef = useRef<PagerRef>(null)
  const lastPagerReportedIndexRef = useRef(selectedIndex)
  useLayoutEffect(() => {
    // Since the pager is not a controlled component, adjust it imperatively
    // if the selected index gets out of sync with what it last reported.
    // This is supposed to only happen on the web when you use the right nav.
    if (selectedIndex !== lastPagerReportedIndexRef.current) {
      lastPagerReportedIndexRef.current = selectedIndex
      pagerRef.current?.setPage(selectedIndex)
    }
  }, [selectedIndex])

  const {hasSession} = useSession()
  const headerMode = useHomeHeaderMode()
  const showHeader = useCallback(() => {
    'worklet'
    headerMode.set(() => withSpring(0, {overshootClamping: true}))
  }, [headerMode])

  useFocusEffect(
    useCallback(() => {
      return () => showHeader()
    }, [showHeader]),
  )

  useFocusEffect(
    useNonReactiveCallback(() => {
      if (maybeSelectedFeed) {
        ax.metric('home:feedDisplayed', {
          index: selectedIndex,
          feedType: maybeSelectedFeed.split('|')[0],
          feedUrl: maybeSelectedFeed,
          reason: 'focus',
        })
      }
    }),
  )

  const onPageSelected = useCallback(
    (index: number) => {
      showHeader()
      // Selecting a feed dismisses the inline Explore view.
      setShowExplore(false)
      const maybeFeed = allFeeds[index]

      // Mutate the ref before setting state to avoid the imperative syncing effect
      // above from starting a loop on Android when swiping back and forth.
      lastPagerReportedIndexRef.current = index
      setSelectedFeed(maybeFeed)

      if (maybeFeed) {
        ax.metric('home:feedDisplayed', {
          index,
          feedType: maybeFeed.split('|')[0],
          feedUrl: maybeFeed,
        })
      }
    },
    [ax, setSelectedFeed, showHeader, allFeeds],
  )

  const onPressSelected = useCallback(() => {
    emitSoftReset()
  }, [])

  const onPressAdd = useCallback(() => {
    setShowExplore(show => !show)
  }, [])

  const focusSearchInput = useCallback(() => {
    setShowExplore(false)
    if (IS_WEB) {
      navigation.navigate('Search', {})
    } else {
      navigation.navigate('SearchTab')
    }
  }, [navigation])

  const onPageScrollStateChanged = useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      'worklet'
      if (state === 'dragging') {
        showHeader()
      }
    },
    [showHeader],
  )

  const [demoMode] = useDemoMode()

  const renderTabBar = useCallback(
    (props: RenderTabBarFnProps) => {
      if (demoMode) {
        return (
          <HomeHeader
            key="FEEDS_TAB_BAR"
            {...props}
            testID="homeScreenFeedTabs"
            onPressSelected={onPressSelected}
            // @ts-ignore
            feeds={[{displayName: 'Following'}, {displayName: 'Discover'}]}
          />
        )
      }
      return (
        <HomeHeader
          key="FEEDS_TAB_BAR"
          {...props}
          testID="homeScreenFeedTabs"
          onPressSelected={onPressSelected}
          onPressAdd={onPressAdd}
          addActive={showExplore}
          feeds={pinnedFeedInfos}
        />
      )
    },
    [onPressSelected, onPressAdd, showExplore, pinnedFeedInfos, demoMode],
  )

  const renderContentOverlay = useCallback(() => {
    if (!showExplore) {
      return null
    }
    return (
      <View style={[{flex: 1, paddingTop: headerOffset}, t.atoms.bg]}>
        <Explore
          focusSearchInput={focusSearchInput}
          headerHeight={0}
          feedsOnly
        />
      </View>
    )
  }, [showExplore, headerOffset, focusSearchInput, t.atoms.bg])

  const renderFollowingEmptyState = useCallback(() => {
    return <FollowingEmptyState />
  }, [])

  const renderCustomFeedEmptyState = useCallback(() => {
    return <CustomFeedEmptyState />
  }, [])

  const homeFeedParams = useMemo<FeedParams>(() => {
    return {
      mergeFeedEnabled: Boolean(preferences.feedViewPrefs.lab_mergeFeedEnabled),
      mergeFeedSources: preferences.feedViewPrefs.lab_mergeFeedEnabled
        ? preferences.savedFeeds
            .filter(f => f.type === 'feed' || f.type === 'list')
            .map(f => f.value)
        : [],
    }
  }, [preferences])

  if (demoMode) {
    return (
      <Pager
        ref={pagerRef}
        testID="homeScreen"
        onPageSelected={onPageSelected}
        renderTabBar={renderTabBar}
        initialPage={selectedIndex}>
        <FeedPage
          testID="demoFeedPage"
          isPageFocused
          isPageAdjacent={false}
          feed="demo"
          renderEmptyState={renderCustomFeedEmptyState}
          feedInfo={pinnedFeedInfos[0]}
        />
        <FeedPage
          testID="customFeedPage"
          isPageFocused
          isPageAdjacent={false}
          feed={`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`}
          renderEmptyState={renderCustomFeedEmptyState}
          feedInfo={pinnedFeedInfos[0]}
        />
      </Pager>
    )
  }

  return hasSession ? (
    <Pager
      key={allFeeds.join(',')}
      ref={pagerRef}
      testID="homeScreen"
      initialPage={selectedIndex}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}
      renderContentOverlay={renderContentOverlay}>
      {pinnedFeedInfos.length ? (
        pinnedFeedInfos.map((feedInfo, index) => {
          const feed = feedInfo.feedDescriptor
          if (feed === 'following') {
            return (
              <FeedPage
                key={feed}
                testID="followingFeedPage"
                isPageFocused={maybeSelectedFeed === feed}
                isPageAdjacent={Math.abs(selectedIndex - index) === 1}
                feed={feed}
                feedParams={homeFeedParams}
                renderEmptyState={renderFollowingEmptyState}
                renderEndOfFeed={FollowingEndOfFeed}
                feedInfo={feedInfo}
              />
            )
          }
          const savedFeedConfig = feedInfo.savedFeed
          return (
            <FeedPage
              key={feed}
              testID="customFeedPage"
              isPageFocused={maybeSelectedFeed === feed}
              isPageAdjacent={Math.abs(selectedIndex - index) === 1}
              feed={feed}
              renderEmptyState={renderCustomFeedEmptyState}
              savedFeedConfig={savedFeedConfig}
              feedInfo={feedInfo}
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
        isPageAdjacent={false}
        feed={`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`}
        renderEmptyState={renderCustomFeedEmptyState}
        feedInfo={pinnedFeedInfos[0]}
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
