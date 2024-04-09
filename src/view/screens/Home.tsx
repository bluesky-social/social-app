import React from 'react'
import {ActivityIndicator, AppState, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {useGate} from '#/lib/statsig/statsig'
import {emitSoftReset} from '#/state/events'
import {FeedSourceInfo, usePinnedFeedsInfos} from '#/state/queries/feed'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSession} from '#/state/session'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {HomeTabNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {FeedPage} from 'view/com/feeds/FeedPage'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {FollowingEndOfFeed} from 'view/com/posts/FollowingEndOfFeed'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText, Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {P, Text} from '#/components/Typography'
import {HomeLoggedOutCTA} from '../com/auth/HomeLoggedOutCTA'
import {HomeHeader} from '../com/home/HomeHeader'

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

  const disableMinShellOnForegrounding = useGate(
    'disable_min_shell_on_foregrounding',
  )
  React.useEffect(() => {
    if (disableMinShellOnForegrounding) {
      const listener = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          setMinimalShellMode(false)
        }
      })
      return () => {
        listener.remove()
      }
    }
  }, [setMinimalShellMode, disableMinShellOnForegrounding])

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

  const firstDialogControl = Dialog.useDialogControl()

  return (
    <View style={{flex: 1}}>
      <Text>What's up</Text>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={firstDialogControl.open}
        label="one">
        <ButtonText>Open Dialog One</ButtonText>
      </Button>

      <Text>Test</Text>

      <Dialog.Outer control={firstDialogControl}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityDescribedBy="dialog-description"
          accessibilityLabelledBy="dialog-title">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <Text>Test Dialog</Text>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                firstDialogControl.close(() => {
                  console.log('close callback')
                })
              }}
              label="Close It">
              <ButtonText>Normal Use (Should just log)</ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                setTimeout(() => {
                  firstDialogControl.open()
                }, 100)

                firstDialogControl.close(() => {
                  console.log('close callback')
                })
              }}
              label="Close It">
              <ButtonText>
                Calls `.open()` in 100ms (Should log before reopening)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                setTimeout(() => {
                  firstDialogControl.open()
                }, 2e3)

                firstDialogControl.close(() => {
                  console.log('close callback')
                })
              }}
              label="Close It">
              <ButtonText>
                Calls `.open()` in 2000ms (Should log after close animation and
                not log on open)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                firstDialogControl.close(() => {
                  console.log('close callback')
                })
                setTimeout(() => {
                  firstDialogControl.close(() => {
                    console.log('close callback after 100ms')
                  })
                }, 100)
              }}
              label="Close It">
              <ButtonText>
                Calls `.open()` then again in 100ms (should log twice)
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </View>
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
