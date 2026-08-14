import {
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {
  type NavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, VIDEO_FEED_URIS} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {type AllNavigatorParams} from '#/lib/routes/types'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {clearFollowingFeedPosition} from '#/state/feed-position'
import {useSetHomeBadge} from '#/state/home-badge'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {
  type FeedDescriptor,
  type FeedParams,
  RQKEY as FEED_RQKEY,
} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {Portal as HomeHeaderPortal} from '#/view/com/home/HomeHeaderPortal'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListMethods} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {
  MainScrollProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {useBreakpoints, useTheme} from '#/alf'
import {SeeNewPostsPill} from '#/components/feeds/SeeNewPostsPill'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {EditBig_Stroke2_Corner2_Rounded as EditBigIcon} from '#/components/icons/EditBig'
import {Portal} from '#/components/Portal'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'

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
  const ax = useAnalytics()
  const {hasSession, currentAccount} = useSession()
  const headerMode = useHomeHeaderMode()
  const isScreenFocused = useIsFocused()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<AllNavigatorParams>>()
  const queryClient = useQueryClient()
  const {openComposer} = useOpenComposer()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feedInfo, hasSession)
  const scrollElRef = useRef<ListMethods>(null)
  const [hasNew, setHasNew] = useState(false)
  /**
   * Whether to show the "See new posts" pill after the feed was restored to
   * the last read position. Cleared once the user returns to the top, either
   * by pressing the pill or by scrolling up on their own.
   */
  const [showResumePill, setShowResumePill] = useState(false)
  /**
   * How many unseen posts are above the user, from either the restore path
   * or the new-posts poll. Shown in the pill.
   */
  const [newPostsCount, setNewPostsCount] = useState(0)
  const wasScrolledDownRef = useRef(false)
  const setHomeBadge = useSetHomeBadge()
  const isVideoFeed = useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return IS_NATIVE && _isVideoFeed
  }, [feedInfo])
  const t = useTheme()

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

  /*
   * The pill renders only while scrolled down, but it should not come back
   * on later scroll-downs, so clear it for good once the user has scrolled
   * back up to the top.
   */
  useEffect(() => {
    if (isScrolledDown) {
      wasScrolledDownRef.current = true
    } else if (wasScrolledDownRef.current) {
      setShowResumePill(false)
    }
  }, [isScrolledDown])

  const onPositionRestored = useCallback((unseenCount: number) => {
    setShowResumePill(true)
    setNewPostsCount(unseenCount)
  }, [])

  const onSoftReset = useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
      if (feed === 'following' && currentAccount) {
        clearFollowingFeedPosition(currentAccount.did)
      }
      ax.metric('feed:refresh', {
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason: 'soft-reset',
      })
    }
  }, [
    ax,
    navigation,
    isPageFocused,
    scrollToTop,
    queryClient,
    feed,
    currentAccount,
  ])

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
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
    if (feed === 'following' && currentAccount) {
      clearFollowingFeedPosition(currentAccount.did)
    }
    ax.metric('feed:refresh', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [ax, scrollToTop, feed, queryClient, currentAccount])

  /*
   * In the restore case the posts above are already loaded, so pressing the
   * pill only needs to scroll up. In the hasNew case they are not loaded
   * yet, so it must refetch like the "Load new posts" button.
   */
  const onPressSeeNewPosts = useCallback(() => {
    setShowResumePill(false)
    if (hasNew) {
      onPressLoadLatest()
    } else {
      scrollToTop()
      ax.metric('feed:resume:seeNewPostsPressed', {})
    }
  }, [ax, hasNew, onPressLoadLatest, scrollToTop])

  const shouldPrefetch = IS_NATIVE && isPageAdjacent
  const isDiscoverFeed = feedInfo.uri === DISCOVER_FEED_URI
  const isFollowingFeed = feed === 'following'
  /*
   * On the Following feed the pill takes over signaling new posts from the
   * LoadLatestBtn indicator, both when new posts arrive while reading
   * (hasNew) and after restoring the last read position. Other feeds keep
   * the LoadLatestBtn indicator.
   *
   * The pill disappears once its promise is fulfilled - the new posts are
   * on screen. After a restore the posts above are already loaded, so
   * reaching the top fulfills it and the pill hides. When hasNew is set the
   * posts are not loaded yet, so the pill persists at any scroll position
   * until it is pressed or the feed is refreshed.
   *
   * Gated on isPageFocused (the pager tab) and isScreenFocused (the Home
   * screen itself) because the pill renders in a Portal outside this
   * page's subtree, so it would otherwise stay visible on other feed tabs
   * and on entirely different screens like Notifications.
   */
  const showSeeNewPostsPill =
    isFollowingFeed &&
    isPageFocused &&
    isScreenFocused &&
    (hasNew || (showResumePill && isScrolledDown))
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
            feed={feed}
            feedParams={feedParams}
            pollInterval={POLL_FREQ}
            /*
             * On the Following feed, keep polling after hasNew so the pill's
             * new-post count stays up to date.
             */
            disablePoll={!isPageFocused || (hasNew && !isFollowingFeed)}
            scrollElRef={scrollElRef}
            onScrolledDownChange={setIsScrolledDown}
            onHasNew={setHasNew}
            onHasNewCount={isFollowingFeed ? setNewPostsCount : undefined}
            onPositionRestored={onPositionRestored}
            renderEmptyState={renderEmptyState}
            renderEndOfFeed={renderEndOfFeed}
            headerOffset={headerOffset}
            savedFeedConfig={savedFeedConfig}
            isVideoFeed={isVideoFeed}
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>
      {showSeeNewPostsPill &&
        (IS_WEB && gtMobile ? (
          /*
           * Larger web layouts anchor the pill inside the home header,
           * directly below the sticky tab bar.
           */
          <HomeHeaderPortal>
            <SeeNewPostsPill
              attached
              count={newPostsCount}
              onPress={onPressSeeNewPosts}
              headerMode={headerMode}
            />
          </HomeHeaderPortal>
        ) : (
          <Portal>
            <SeeNewPostsPill
              count={newPostsCount}
              onPress={onPressSeeNewPosts}
              topOffset={headerOffset}
              headerMode={headerMode}
            />
          </Portal>
        ))}
      {(isScrolledDown || (hasNew && !isFollowingFeed)) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew && !isFollowingFeed}
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
