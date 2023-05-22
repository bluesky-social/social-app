import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useTabFocusEffect} from 'lib/hooks/useTabFocusEffect'
import {Feed} from '../com/posts/Feed'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {WhatsHotEmptyState} from 'view/com/posts/WhatsHotEmptyState'
import {LoadLatestBtn} from '../com/util/load-latest/LoadLatestBtn'
import {FeedsTabBar} from '../com/pager/FeedsTabBar'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FAB} from '../com/util/fab/FAB'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'
import {isDesktopWeb} from 'platform/detection'

const HEADER_OFFSET = isDesktopWeb ? 50 : 40
const POLL_FREQ = 30e3 // 30sec

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired(
  observer((_opts: Props) => {
    const store = useStores()
    const [selectedPage, setSelectedPage] = React.useState(0)
    const [initialLanguages] = React.useState(
      store.preferences.contentLanguages,
    )

    const algoFeed: PostsFeedModel = React.useMemo(() => {
      const feed = new PostsFeedModel(store, 'goodstuff', {})
      feed.setup()
      return feed
    }, [store])

    React.useEffect(() => {
      // refresh whats hot when lang preferences change
      if (initialLanguages !== store.preferences.contentLanguages) {
        algoFeed.refresh()
      }
    }, [initialLanguages, store.preferences.contentLanguages, algoFeed])

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
      [store, setSelectedPage],
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

    const renderWhatsHotEmptyState = React.useCallback(() => {
      return <WhatsHotEmptyState />
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
          renderEmptyState={renderWhatsHotEmptyState}
        />
      </Pager>
    )
  }),
)

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
        feed.refresh()
        scrollToTop()
      }
    }, [isPageFocused, scrollToTop, feed])

    // fires when screen is activated/deactivated
    // - set up polls/listeners, update content
    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const feedCleanup = feed.registerListeners()
        const pollInterval = setInterval(doPoll, POLL_FREQ)

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
    // fires when tab is activated/deactivated
    // - check for latest
    useTabFocusEffect(
      'Home',
      React.useCallback(
        isInside => {
          if (!isPageFocused || !isInside) {
            return
          }
          feed.checkForLatest()
        },
        [isPageFocused, feed],
      ),
    )
    // fires when page within screen is activated/deactivated
    // - check for latest
    React.useEffect(() => {
      if (isPageFocused && isScreenFocused) {
        feed.checkForLatest()
      }
    }, [isPageFocused, isScreenFocused, feed])

    const onPressCompose = React.useCallback(() => {
      track('HomeScreen:PressCompose')
      store.shell.openComposer({})
    }, [store, track])

    const onPressTryAgain = React.useCallback(() => {
      feed.refresh()
    }, [feed])

    const onPressLoadLatest = React.useCallback(() => {
      scrollToTop()
      feed.refresh()
    }, [feed, scrollToTop])

    return (
      <View testID={testID} style={s.h100pct}>
        <Feed
          testID={testID ? `${testID}-feed` : undefined}
          key="default"
          feed={feed}
          scrollElRef={scrollElRef}
          showPostFollowBtn
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          renderEmptyState={renderEmptyState}
          headerOffset={HEADER_OFFSET}
        />
        {feed.hasNewLatest && !feed.isRefreshing && (
          <LoadLatestBtn onPress={onPressLoadLatest} label="posts" />
        )}
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel="Compose post"
          accessibilityHint=""
        />
      </View>
    )
  },
)
