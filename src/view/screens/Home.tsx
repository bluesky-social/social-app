import React from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {FeedsTabBar} from '../com/pager/FeedsTabBar'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FeedPage} from 'view/com/feeds/FeedPage'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {emitSoftReset} from '#/state/events'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired(
  observer(function HomeScreenImpl({}: Props) {
    const setMinimalShellMode = useSetMinimalShellMode()
    const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
    const pagerRef = React.useRef<PagerRef>(null)
    const [selectedPage, setSelectedPage] = React.useState(0)
    const [customFeeds, setCustomFeeds] = React.useState<FeedDescriptor[]>([])
    const {data: preferences} = usePreferencesQuery()

    React.useEffect(() => {
      if (!preferences?.feeds?.pinned) return

      const pinned = preferences.feeds.pinned

      const feeds: FeedDescriptor[] = []

      for (const uri of pinned) {
        if (uri.includes('app.bsky.feed.generator')) {
          feeds.push(`feedgen|${uri}`)
        } else if (uri.includes('app.bsky.graph.list')) {
          feeds.push(`list|${uri}`)
        }
      }

      setCustomFeeds(feeds)

      pagerRef.current?.setPage(0)
    }, [preferences?.feeds?.pinned, setCustomFeeds, pagerRef])

    const homeFeedParams = React.useMemo<FeedParams>(() => {
      if (!preferences) return {}

      return {
        mergeFeedEnabled: Boolean(
          preferences.feedViewPrefs.lab_mergeFeedEnabled,
        ),
        mergeFeedSources: preferences.feeds.saved,
      }
    }, [preferences])

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
        setDrawerSwipeDisabled(selectedPage > 0)
        return () => {
          setDrawerSwipeDisabled(false)
        }
      }, [setDrawerSwipeDisabled, selectedPage, setMinimalShellMode]),
    )

    const onPageSelected = React.useCallback(
      (index: number) => {
        setMinimalShellMode(false)
        setSelectedPage(index)
        setDrawerSwipeDisabled(index > 0)
      },
      [setDrawerSwipeDisabled, setSelectedPage, setMinimalShellMode],
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
        onPageScrollStateChanged={onPageScrollStateChanged}
        renderTabBar={renderTabBar}
        tabBarPosition="top">
        <FeedPage
          key="1"
          testID="followingFeedPage"
          isPageFocused={selectedPage === 0}
          feed="home"
          feedParams={homeFeedParams}
          renderEmptyState={renderFollowingEmptyState}
          renderEndOfFeed={FollowingEndOfFeed}
        />
        {customFeeds.map((f, index) => {
          return (
            <FeedPage
              key={f}
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
