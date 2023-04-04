import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from '../com/posts/Feed'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {FeedsTabBar} from '../com/pager/FeedsTabBar'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FAB} from '../com/util/FAB'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'

const HEADER_OFFSET = 40

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired((_opts: Props) => {
  const store = useStores()
  const [selectedPage, setSelectedPage] = React.useState(0)

  const algoFeed = React.useMemo(() => {
    const feed = new PostsFeedModel(store, 'goodstuff', {})
    feed.setup()
    return feed
  }, [store])

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
      store.shell.setIsDrawerSwipeDisabled(selectedPage > 0)
      return () => {
        store.shell.setIsDrawerSwipeDisabled(false)
      }
    }, [store, selectedPage]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      store.shell.setMinimalShellMode(false)
      setSelectedPage(index)
      store.shell.setIsDrawerSwipeDisabled(index > 0)
    },
    [store],
  )

  const onPressSelected = React.useCallback(() => {
    store.emitScreenSoftReset()
  }, [store])

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <FeedsTabBar
          {...props}
          testID="homeScreenFeedTabs"
          onPressSelected={onPressSelected}
        />
      )
    },
    [onPressSelected],
  )

  const renderFollowingEmptyState = React.useCallback(() => {
    return <FollowingEmptyState />
  }, [])

  const initialPage = store.me.followsCount === 0 ? 1 : 0
  return (
    <Pager
      testID="homeScreen"
      onPageSelected={onPageSelected}
      renderTabBar={renderTabBar}
      tabBarPosition="top"
      initialPage={initialPage}>
      <FeedPage
        key="1"
        testID="followingFeedPage"
        isPageFocused={selectedPage === 0}
        feed={store.me.mainFeed}
        renderEmptyState={renderFollowingEmptyState}
      />
      <FeedPage
        key="2"
        testID="whatshotFeedPage"
        isPageFocused={selectedPage === 1}
        feed={algoFeed}
      />
    </Pager>
  )
})

const FeedPage = observer(
  ({
    testID,
    isPageFocused,
    feed,
    renderEmptyState,
  }: {
    testID?: string
    feed: PostsFeedModel
    isPageFocused: boolean
    renderEmptyState?: () => JSX.Element
  }) => {
    const store = useStores()
    const onMainScroll = useOnMainScroll(store)
    const {screen, track} = useAnalytics()
    const scrollElRef = React.useRef<FlatList>(null)
    const {appState} = useAppState({
      onForeground: () => doPoll(true),
    })
    const isScreenFocused = useIsFocused()

    const doPoll = React.useCallback(
      (knownActive = false) => {
        if (
          (!knownActive && appState !== 'active') ||
          !isScreenFocused ||
          !isPageFocused
        ) {
          return
        }
        if (feed.isLoading) {
          return
        }
        store.log.debug('HomeScreen: Polling for new posts')
        feed.checkForLatest()
      },
      [appState, isScreenFocused, isPageFocused, store, feed],
    )

    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -HEADER_OFFSET})
    }, [scrollElRef])

    const onSoftReset = React.useCallback(() => {
      if (isPageFocused) {
        scrollToTop()
      }
    }, [isPageFocused, scrollToTop])

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const feedCleanup = feed.registerListeners()
        const pollInterval = setInterval(doPoll, 15e3)

        screen('Feed')
        store.log.debug('HomeScreen: Updating feed')
        if (feed.hasContent) {
          feed.update()
        }

        return () => {
          clearInterval(pollInterval)
          softResetSub.remove()
          feedCleanup()
        }
      }, [store, doPoll, onSoftReset, screen, feed]),
    )

    const onPressCompose = React.useCallback(() => {
      track('HomeScreen:PressCompose')
      store.shell.openComposer({})
    }, [store, track])

    const onPressTryAgain = React.useCallback(() => {
      feed.refresh()
    }, [feed])

    const onPressLoadLatest = React.useCallback(() => {
      feed.resetToLatest()
      scrollToTop()
    }, [feed, scrollToTop])

    return (
      <View testID={testID} style={s.h100pct}>
        <Feed
          testID={testID ? `${testID}-feed` : undefined}
          key="default"
          feed={feed}
          scrollElRef={scrollElRef}
          style={s.hContentRegion}
          showPostFollowBtn
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          renderEmptyState={renderEmptyState}
          headerOffset={HEADER_OFFSET}
        />
        {feed.hasNewLatest && !feed.isRefreshing && (
          <LoadLatestBtn onPress={onPressLoadLatest} />
        )}
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        />
      </View>
    )
  },
)
