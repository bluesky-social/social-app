import React from 'react'
import {useWindowDimensions} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {AppBskyFeedGetFeed as GetCustomFeed} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import isEqual from 'lodash.isequal'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {FeedsTabBar} from '../com/pager/FeedsTabBar'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {FeedPage} from 'view/com/feeds/FeedPage'

export const POLL_FREQ = 30e3 // 30sec

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired(
  observer(function HomeScreenImpl({}: Props) {
    const store = useStores()
    const pagerRef = React.useRef<PagerRef>(null)
    const [selectedPage, setSelectedPage] = React.useState(0)
    const [customFeeds, setCustomFeeds] = React.useState<PostsFeedModel[]>([])
    const [requestedCustomFeeds, setRequestedCustomFeeds] = React.useState<
      string[]
    >([])

    React.useEffect(() => {
      const {pinned} = store.me.savedFeeds

      if (
        isEqual(
          pinned.map(p => p.uri),
          requestedCustomFeeds,
        )
      ) {
        // no changes
        return
      }

      const feeds = []
      for (const feed of pinned) {
        const model = new PostsFeedModel(store, 'custom', {feed: feed.uri})
        feeds.push(model)
      }
      pagerRef.current?.setPage(0)
      setCustomFeeds(feeds)
      setRequestedCustomFeeds(pinned.map(p => p.uri))
    }, [
      store,
      store.me.savedFeeds.pinned,
      customFeeds,
      setCustomFeeds,
      pagerRef,
      requestedCustomFeeds,
      setRequestedCustomFeeds,
    ])

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
            key="FEEDS_TAB_BAR"
            selectedPage={props.selectedPage}
            onSelect={props.onSelect}
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

    const renderCustomFeedEmptyState = React.useCallback(() => {
      return <CustomFeedEmptyState />
    }, [])

    return (
      <Pager
        ref={pagerRef}
        testID="homeScreen"
        onPageSelected={onPageSelected}
        renderTabBar={renderTabBar}
        tabBarPosition="top">
        <FeedPage
          key="1"
          testID="followingFeedPage"
          isPageFocused={selectedPage === 0}
          feed={store.me.mainFeed}
          renderEmptyState={renderFollowingEmptyState}
          renderEndOfFeed={FollowingEndOfFeed}
        />
        {customFeeds.map((f, index) => {
          return (
            <FeedPage
              key={(f.params as GetCustomFeed.QueryParams).feed}
              testID="customFeedPage"
              isPageFocused={selectedPage === 1 + index}
              feed={f}
              renderEmptyState={renderCustomFeedEmptyState}
            />
          )
        })}
      </Pager>
    )
  }),
)

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop) {
    return 0
  }
  if (isTablet) {
    return 50
  }
  // default text takes 44px, plus 34px of pad
  // scale the 44px by the font scale
  return 34 + 44 * fontScale
}
