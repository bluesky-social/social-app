import React, {useMemo} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewSelectorHandle} from '../com/util/ViewSelector'
import {CenteredView} from '../com/util/Views'
import {ScreenHider} from 'view/com/util/moderation/ScreenHider'
import {Feed} from 'view/com/posts/Feed'
import {ProfileLists} from '../com/lists/ProfileLists'
import {ProfileFeedgens} from '../com/feeds/ProfileFeedgens'
import {useStores} from 'state/index'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ErrorScreen} from '../com/util/error/ErrorScreen'
import {EmptyState} from '../com/util/EmptyState'
import {FAB} from '../com/util/fab/FAB'
import {s, colors} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {ComposeIcon2} from 'lib/icons'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {combinedDisplayName} from 'lib/strings/display-names'
import {OnScrollHandler} from '#/lib/hooks/useOnMainScroll'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useProfileQuery} from '#/state/queries/profile'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useSession} from '#/state/session'
import {useModerationOpts} from '#/state/queries/preferences'
import {useProfileExtraInfoQuery} from '#/state/queries/profile-extra-info'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
import {cleanError} from '#/lib/strings/errors'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export const ProfileScreen = withAuthRequired(function ProfileScreenImpl({
  route,
}: Props) {
  const {currentAccount} = useSession()
  const name =
    route.params.name === 'me' ? currentAccount?.did : route.params.name
  const moderationOpts = useModerationOpts()
  const {
    data: resolvedDid,
    error: resolveError,
    refetch: refetchDid,
    isFetching: isFetchingDid,
  } = useResolveDidQuery(name)
  const {
    data: profile,
    dataUpdatedAt,
    error: profileError,
    refetch: refetchProfile,
    isFetching: isFetchingProfile,
  } = useProfileQuery({
    did: resolvedDid?.did,
  })

  const onPressTryAgain = React.useCallback(() => {
    if (resolveError) {
      refetchDid()
    } else {
      refetchProfile()
    }
  }, [resolveError, refetchDid, refetchProfile])

  if (isFetchingDid || isFetchingProfile) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }
  if (resolveError || profileError) {
    return (
      <CenteredView>
        <ErrorScreen
          testID="profileErrorScreen"
          title="Oops!"
          message={cleanError(resolveError || profileError)}
          onPressTryAgain={onPressTryAgain}
        />
      </CenteredView>
    )
  }
  if (profile && moderationOpts) {
    return (
      <ProfileScreenLoaded
        profile={profile}
        dataUpdatedAt={dataUpdatedAt}
        moderationOpts={moderationOpts}
        hideBackButton={!!route.params.hideBackButton}
      />
    )
  }
  // should never happen
  return (
    <CenteredView>
      <ErrorScreen
        testID="profileErrorScreen"
        title="Oops!"
        message="Something went wrong and we're not sure what."
        onPressTryAgain={onPressTryAgain}
      />
    </CenteredView>
  )
})

function ProfileScreenLoaded({
  profile: profileUnshadowed,
  dataUpdatedAt,
  moderationOpts,
  hideBackButton,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  dataUpdatedAt: number
  moderationOpts: ModerationOpts
  hideBackButton: boolean
}) {
  const profile = useProfileShadow(profileUnshadowed, dataUpdatedAt)
  const store = useStores()
  const {currentAccount} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen, track} = useAnalytics()
  const [currentPage, setCurrentPage] = React.useState(0)
  const {_} = useLingui()
  const viewSelectorRef = React.useRef<ViewSelectorHandle>(null)
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const extraInfoQuery = useProfileExtraInfoQuery(profile.did)

  useSetTitle(combinedDisplayName(profile))

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  const isMe = profile.did === currentAccount?.did
  const showLikesTab = isMe
  const showFeedsTab = isMe || extraInfoQuery.data?.hasFeedgens
  const showListsTab = isMe || extraInfoQuery.data?.hasLists
  const sectionTitles = useMemo<string[]>(() => {
    return [
      'Posts',
      'Posts & Replies',
      'Media',
      showLikesTab ? 'Likes' : undefined,
      showFeedsTab ? 'Feeds' : undefined,
      showListsTab ? 'Lists' : undefined,
    ].filter(Boolean) as string[]
  }, [showLikesTab, showFeedsTab, showListsTab])

  /*
    - todo
        - feeds
        - lists
    */

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      screen('Profile')
      const softResetSub = store.onScreenSoftReset(() => {
        viewSelectorRef.current?.scrollToTop()
      })
      return () => softResetSub.remove()
    }, [store, viewSelectorRef, setMinimalShellMode, screen]),
  )

  useFocusEffect(
    React.useCallback(() => {
      setDrawerSwipeDisabled(currentPage > 0)
      return () => {
        setDrawerSwipeDisabled(false)
      }
    }, [setDrawerSwipeDisabled, currentPage]),
  )

  // events
  // =

  const onPressCompose = React.useCallback(() => {
    track('ProfileScreen:PressCompose')
    const mention =
      profile.handle === currentAccount?.handle ||
      profile.handle === 'handle.invalid'
        ? undefined
        : profile.handle
    store.shell.openComposer({mention})
  }, [store, currentAccount, track, profile])

  const onPageSelected = React.useCallback(
    i => {
      setCurrentPage(i)
    },
    [setCurrentPage],
  )

  // rendering
  // =

  const renderHeader = React.useCallback(() => {
    return (
      <ProfileHeader
        profile={profile}
        moderation={moderation}
        hideBackButton={hideBackButton}
      />
    )
  }, [profile, moderation, hideBackButton])

  return (
    <ScreenHider
      testID="profileView"
      style={styles.container}
      screenDescription="profile"
      moderation={moderation.account}>
      <PagerWithHeader
        isHeaderReady={true}
        items={sectionTitles}
        onPageSelected={onPageSelected}
        renderHeader={renderHeader}>
        {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
          <FeedSection
            ref={null}
            feed={`author|${profile.did}|posts_no_replies`}
            onScroll={onScroll}
            headerHeight={headerHeight}
            isScrolledDown={isScrolledDown}
            scrollElRef={scrollElRef}
          />
        )}
        {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
          <FeedSection
            ref={null}
            feed={`author|${profile.did}|posts_with_replies`}
            onScroll={onScroll}
            headerHeight={headerHeight}
            isScrolledDown={isScrolledDown}
            scrollElRef={scrollElRef}
          />
        )}
        {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
          <FeedSection
            ref={null}
            feed={`author|${profile.did}|posts_with_media`}
            onScroll={onScroll}
            headerHeight={headerHeight}
            isScrolledDown={isScrolledDown}
            scrollElRef={scrollElRef}
          />
        )}
        {showLikesTab
          ? ({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
              <FeedSection
                ref={null}
                feed={`likes|${profile.did}`}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isScrolledDown={isScrolledDown}
                scrollElRef={scrollElRef}
              />
            )
          : null}
        {showFeedsTab
          ? ({onScroll, headerHeight, scrollElRef}) => (
              <ProfileFeedgens
                did={profile.did}
                scrollElRef={scrollElRef}
                onScroll={onScroll}
                scrollEventThrottle={1}
                headerOffset={headerHeight}
              />
            )
          : null}
        {showListsTab
          ? ({onScroll, headerHeight, scrollElRef}) => (
              <ProfileLists
                did={profile.did}
                scrollElRef={scrollElRef}
                onScroll={onScroll}
                scrollEventThrottle={1}
                headerOffset={headerHeight}
              />
            )
          : null}
      </PagerWithHeader>
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </ScreenHider>
  )
}

interface FeedSectionProps {
  feed: FeedDescriptor
  onScroll: OnScrollHandler
  headerHeight: number
  isScrolledDown: boolean
  scrollElRef: any /* TODO */
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {
      feed,
      onScroll,
      headerHeight,
      // isScrolledDown,
      scrollElRef,
    },
    ref,
  ) {
    // const hasNew = false //TODO feed.hasNewLatest && !feed.isRefreshing

    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -headerHeight})
      // feed.refresh() TODO
    }, [scrollElRef, headerHeight])
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = React.useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    return (
      <View>
        <Feed
          testID="postsFeed"
          feed={feed}
          scrollElRef={scrollElRef}
          onScroll={onScroll}
          scrollEventThrottle={1}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  loading: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  emptyState: {
    paddingVertical: 40,
  },
  loadingMoreFooter: {
    paddingVertical: 20,
  },
  endItem: {
    paddingTop: 20,
    paddingBottom: 30,
    color: colors.gray5,
    textAlign: 'center',
  },
})
