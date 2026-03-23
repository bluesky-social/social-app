import {useCallback, useEffect, useMemo, useState} from 'react'
import {useAnimatedRef} from 'react-native-reanimated'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {VIDEO_FEED_URIS} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {
  type FeedSourceFeedInfo,
  useFeedSourceInfoQuery,
} from '#/state/queries/feed'
import {type FeedDescriptor, type FeedParams} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {PostFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {
  ProfileFeedHeader,
  ProfileFeedHeaderSkeleton,
} from '#/screens/Profile/components/ProfileFeedHeader'
import {HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon} from '#/components/icons/Hashtag'
import * as Layout from '#/components/Layout'
import {IS_NATIVE} from '#/env'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeed'>
export function ProfileFeedScreen(props: Props) {
  const {rkey, name: handleOrDid} = props.route.params

  const feedParams: FeedParams | undefined = props.route.params.feedCacheKey
    ? {feedCacheKey: props.route.params.feedCacheKey}
    : undefined
  const {_} = useLingui()

  const uri = useMemo(
    () => makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey),
    [rkey, handleOrDid],
  )
  let {
    error,
    data: resolvedUri,
    refetch,
    isRefetching,
  } = useResolveUriQuery(uri)

  if (error && !isRefetching) {
    return (
      <Layout.Screen testID="profileFeedScreenError">
        <ErrorScreen
          showHeader
          title={_(msg`Could not load feed`)}
          message={cleanError(error)}
          onPressTryAgain={() => void refetch()}
        />
      </Layout.Screen>
    )
  }

  return resolvedUri ? (
    <Layout.Screen testID="profileFeedScreen">
      <ProfileFeedScreenIntermediate
        feedUri={resolvedUri.uri}
        feedParams={feedParams}
      />
    </Layout.Screen>
  ) : (
    <Layout.Screen testID="profileFeedScreen">
      <ProfileFeedHeaderSkeleton />
      <Layout.Content>
        <PostFeedLoadingPlaceholder />
      </Layout.Content>
    </Layout.Screen>
  )
}

function ProfileFeedScreenIntermediate({
  feedUri,
  feedParams,
}: {
  feedUri: string
  feedParams: FeedParams | undefined
}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: info} = useFeedSourceInfoQuery({uri: feedUri})

  if (!preferences || !info) {
    return (
      <Layout.Content>
        <ProfileFeedHeaderSkeleton />
        <PostFeedLoadingPlaceholder />
      </Layout.Content>
    )
  }

  return (
    <ProfileFeedScreenInner
      preferences={preferences}
      feedInfo={info as FeedSourceFeedInfo}
      feedParams={feedParams}
    />
  )
}

export function ProfileFeedScreenInner({
  feedInfo,
  feedParams,
}: {
  preferences: UsePreferencesQueryResponse
  feedInfo: FeedSourceFeedInfo
  feedParams: FeedParams | undefined
}) {
  const {_} = useLingui()
  const {hasSession} = useSession()
  const {openComposer} = useOpenComposer()
  const isScreenFocused = useIsFocused()

  useSetTitle(feedInfo?.displayName)

  const feed = `feedgen|${feedInfo.uri}` as FeedDescriptor

  const [hasNew, setHasNew] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const queryClient = useQueryClient()
  const feedFeedback = useFeedFeedback(feedInfo, hasSession)
  const scrollElRef = useAnimatedRef() as ListRef

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: 0, // -headerHeight,
    })
    void truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
  }, [scrollElRef, queryClient, feed, setHasNew])

  useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onScrollToTop)
  }, [onScrollToTop, isScreenFocused])

  const renderPostsEmpty = useCallback(() => {
    return (
      <EmptyState
        icon={HashtagWideIcon}
        iconSize="2xl"
        message={_(msg`This feed is empty.`)}
      />
    )
  }, [_])

  const isVideoFeed = useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === AppBskyFeedDefs.CONTENTMODEVIDEO
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return IS_NATIVE && _isVideoFeed
  }, [feedInfo])

  return (
    <>
      <ProfileFeedHeader info={feedInfo} />

      <FeedFeedbackProvider value={feedFeedback}>
        <PostFeed
          feed={feed}
          feedParams={feedParams}
          pollInterval={60e3}
          disablePoll={hasNew}
          onHasNew={setHasNew}
          scrollElRef={scrollElRef}
          onScrolledDownChange={setIsScrolledDown}
          renderEmptyState={renderPostsEmpty}
          isVideoFeed={isVideoFeed}
        />
      </FeedFeedbackProvider>

      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onScrollToTop}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={() => openComposer({logContext: 'Fab'})}
          icon={
            <ComposeIcon2
              strokeWidth={1.5}
              size={29}
              style={{color: 'white'}}
            />
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </>
  )
}
