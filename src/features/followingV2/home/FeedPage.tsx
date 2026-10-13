import {
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {
  type NavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native'

import {DISCOVER_FEED_URI, VIDEO_FEED_URIS} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {type AllNavigatorParams} from '#/lib/routes/types'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useSetHomeBadge} from '#/state/home-badge'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListMethods} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {useBreakpoints, useTheme} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {EditBig_Stroke2_Corner2_Rounded as EditBigIcon} from '#/components/icons/EditBig'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {
  isFollowingV2Eligible,
  isFollowingV2HomeDotEnabled,
} from '#/features/followingV2/eligibility'
import {app} from '#/lexicons'
import {PostFeed, type PostFeedRef} from './PostFeed'
import {type FeedDescriptor, type FeedParams} from './queries/postFeed'

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
  savedFeedConfig?: app.bsky.actor.defs.SavedFeed
  feedInfo: FeedSourceInfo
}) {
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<AllNavigatorParams>>()
  const isScreenFocused = useIsFocused()
  const {openComposer} = useOpenComposer()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feedInfo, hasSession)
  const scrollElRef = useRef<ListMethods>(null)
  const feedRef = useRef<PostFeedRef>(null)
  const [hasNew, setHasNew] = useState(false)
  const setHomeBadge = useSetHomeBadge()
  const isVideoFeed = useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === app.bsky.feed.defs.contentModeVideo.value
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return IS_NATIVE && _isVideoFeed
  }, [feedInfo])
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  useEffect(() => {
    if (isPageFocused) {
      setHomeBadge(hasNew)
    }
  }, [isPageFocused, hasNew, setHomeBadge])

  const scrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerOffset,
    })
  }, [headerOffset])

  const onSoftReset = useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      void feedRef.current?.refresh()
      setHasNew(false)
      ax.metric('feed:refresh', {
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason: 'soft-reset',
      })
    }
  }, [ax, navigation, isPageFocused, scrollToTop, feed])

  // fires when page within screen is activated/deactivated
  useEffect(() => {
    if (!isPageFocused) {
      return
    }
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isPageFocused])

  const onPressCompose = useCallback(() => {
    openComposer({logContext: 'Fab'})
  }, [openComposer])

  const onPressLoadLatest = useCallback(() => {
    scrollToTop()
    void feedRef.current?.refresh()
    setHasNew(false)
    ax.metric('feed:refresh', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [ax, scrollToTop, feed])

  const shouldPrefetch = IS_NATIVE && isPageAdjacent
  const isDiscoverFeed = feedInfo.uri === DISCOVER_FEED_URI
  return (
    <View
      testID={testID}
      // @ts-expect-error web only -sfn
      dataSet={{nosnippet: isDiscoverFeed ? '' : undefined}}>
      <MainScrollProvider>
        <FeedFeedbackProvider value={feedFeedback}>
          <PostFeed
            testID={testID ? `${testID}-feed` : undefined}
            enabled={isPageFocused || shouldPrefetch}
            isActive={isPageFocused && isScreenFocused}
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
            ref={feedRef}
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>
      {/*
       * With Following v2, native replaces Load Latest with the new posts pill
       * and mobile web relies on the Home tab dot. Tablet and desktop web have
       * no pill, so they keep the button.
       */}
      {(isScrolledDown || hasNew) &&
        !isFollowingV2Eligible(ax) &&
        !(isFollowingV2HomeDotEnabled(ax) && !gtMobile) && (
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
          icon={<EditBigIcon size="lg" fill={t.palette.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg({message: `New post`, context: 'action'}))}
          accessibilityHint=""
        />
      )}
    </View>
  )
}
