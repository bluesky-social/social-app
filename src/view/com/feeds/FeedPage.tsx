import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {VIDEO_FEED_URIS} from '#/lib/constants'
import {ComposeIcon2} from '#/lib/icons'
import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {AllNavigatorParams} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useSetHomeBadge} from '#/state/home-badge'
import {SavedFeedSourceInfo} from '#/state/queries/feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {PostFeed} from '../posts/PostFeed'
import {FAB} from '../util/fab/FAB'
import {ListMethods} from '../util/List'
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
  feedInfo: SavedFeedSourceInfo
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<AllNavigatorParams>>()
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const setMinimalShellMode = useSetMinimalShellMode()
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feed, hasSession)
  const scrollElRef = React.useRef<ListMethods>(null)
  const [hasNew, setHasNew] = React.useState(false)
  const setHomeBadge = useSetHomeBadge()
  const isVideoFeed = React.useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return isNative && _isVideoFeed
  }, [feedInfo])

  React.useEffect(() => {
    if (isPageFocused) {
      setHomeBadge(hasNew)
    }
  }, [isPageFocused, hasNew, setHomeBadge])

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
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isPageFocused])

  const onPressCompose = React.useCallback(() => {
    openComposer({})
  }, [openComposer])

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

  const shouldPrefetch = isNative && isPageAdjacent
  return (
    <View testID={testID}>
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
