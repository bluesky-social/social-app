import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, VIDEO_FEED_URIS} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {ComposeIcon2} from '#/lib/icons'
import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {type AllNavigatorParams} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useSetHomeBadge} from '#/state/home-badge'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {type FeedDescriptor, type FeedParams} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {PostFeed} from '../posts/PostFeed'
import {FAB} from '../util/fab/FAB'
import {type ListMethods} from '../util/List'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '../util/MainScrollProvider'

const POLL_FREQ = 60e3 // 60sec

export function FeedPage({
  testID,
  isPageFocused,
  isPageAdjacent,
  feed,
  feedParams,
  renderEmptyState,
  renderEndOfFeed,
  savedFeedConfig,
  feedInfo,
}: {
  testID?: string
  feed: FeedDescriptor
  feedParams?: FeedParams
  isPageFocused: boolean
  isPageAdjacent: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  savedFeedConfig?: AppBskyActorDefs.SavedFeed
  feedInfo: FeedSourceInfo
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<AllNavigatorParams>>()
  const queryClient = useQueryClient()
  const {openComposer} = useOpenComposer()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const setMinimalShellMode = useSetMinimalShellMode()
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feedInfo, hasSession)
  const scrollElRef = useRef<ListMethods>(null)
  const [hasNew, setHasNew] = useState(false)
  const setHomeBadge = useSetHomeBadge()
  const isVideoFeed = useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return isNative && _isVideoFeed
  }, [feedInfo])

  const isDiscoverFeed = useMemo(() => {
    return feedInfo.uri === DISCOVER_FEED_URI
  }, [feedInfo.uri])

  useEffect(() => {
    if (isPageFocused) {
      setHomeBadge(hasNew)
    }
  }, [isPageFocused, hasNew, setHomeBadge])

  const scrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    setMinimalShellMode(false)
  }, [headerOffset, setMinimalShellMode])

  const onSoftReset = useCallback(() => {
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
  }, [navigation, isPageFocused, scrollToTop, queryClient, feed])

  // fires when page within screen is activated/deactivated
  useEffect(() => {
    if (!isPageFocused) {
      return
    }
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isPageFocused])

  const onPressCompose = useCallback(() => {
    openComposer({})
  }, [openComposer])

  const onPressLoadLatest = useCallback(() => {
    scrollToTop()
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
    logEvent('feed:refresh', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [scrollToTop, feed, queryClient])

  const shouldPrefetch = isNative && isPageAdjacent
  return (
    <View testID={testID} {...(isDiscoverFeed && {'data-nosnippet': true})}>
      <MainScrollProvider>
        <FeedFeedbackProvider value={feedFeedback}>
          <PostFeed
            testID={testID ? `${testID}-feed` : undefined}
            enabled={isPageFocused || shouldPrefetch}
            feed={feed}
            feedParams={feedParams}
            pollInterval={POLL_FREQ}
            disablePoll={hasNew || !isPageFocused}
            scrollElRef={scrollElRef}
            onScrolledDownChange={setIsScrolledDown}
            onHasNew={setHasNew}
            renderEmptyState={renderEmptyState}
            renderEndOfFeed={renderEndOfFeed}
            headerOffset={headerOffset}
            savedFeedConfig={savedFeedConfig}
            isVideoFeed={isVideoFeed}
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
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
