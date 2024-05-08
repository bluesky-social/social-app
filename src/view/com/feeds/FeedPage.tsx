import React from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {logEvent, useGate} from '#/lib/statsig/statsig'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from 'lib/icons'
import {s} from 'lib/styles'
import {Feed} from '../posts/Feed'
import {FAB} from '../util/fab/FAB'
import {ListMethods} from '../util/List'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '../util/MainScrollProvider'

const POLL_FREQ = 60e3 // 60sec

export function FeedPage({
  testID,
  isPageFocused,
  feed,
  feedParams,
  renderEmptyState,
  renderEndOfFeed,
}: {
  testID?: string
  feed: FeedDescriptor
  feedParams?: FeedParams
  isPageFocused: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen, track} = useAnalytics()
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feed, hasSession)
  const scrollElRef = React.useRef<ListMethods>(null)
  const [hasNew, setHasNew] = React.useState(false)
  const gate = useGate()

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    setMinimalShellMode(false)
  }, [headerOffset, setMinimalShellMode])

  const onSoftReset = React.useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
      logEvent('feed:refresh', {
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason: 'soft-reset',
      })
    }
  }, [navigation, isPageFocused, scrollToTop, queryClient, feed, setHasNew])

  // fires when page within screen is activated/deactivated
  React.useEffect(() => {
    if (!isPageFocused) {
      return
    }
    screen('Feed')
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, screen, isPageFocused])

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    openComposer({})
  }, [openComposer, track])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
    logEvent('feed:refresh', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [scrollToTop, feed, queryClient, setHasNew])

  const isDiscoverFeed =
    feed ===
    'feedgen|at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
  const adjustedHasNew =
    hasNew && !(isDiscoverFeed && gate('disable_poll_on_discover_v2'))

  return (
    <View testID={testID} style={s.h100pct}>
      <MainScrollProvider>
        <FeedFeedbackProvider value={feedFeedback}>
          <Feed
            testID={testID ? `${testID}-feed` : undefined}
            enabled={isPageFocused}
            feed={feed}
            feedParams={feedParams}
            pollInterval={POLL_FREQ}
            disablePoll={hasNew}
            scrollElRef={scrollElRef}
            onScrolledDownChange={setIsScrolledDown}
            onHasNew={setHasNew}
            renderEmptyState={renderEmptyState}
            renderEndOfFeed={renderEndOfFeed}
            headerOffset={headerOffset}
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>
      {(isScrolledDown || adjustedHasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={adjustedHasNew}
        />
      )}

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg({message: `New post`, context: 'action'}))}
          accessibilityHint=""
        />
      )}
    </View>
  )
}

function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop || isTablet) {
    return 0
  }
  const navBarHeight = 42
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 1.2
  const tabBarText = 16 * normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText
}
