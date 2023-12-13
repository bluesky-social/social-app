import React, {useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {CenteredView} from '../com/util/Views'
import {ListRef} from '../com/util/List'
import {ScreenHider} from 'view/com/util/moderation/ScreenHider'
import {Feed} from 'view/com/posts/Feed'
import {ProfileLists} from '../com/lists/ProfileLists'
import {ProfileFeedgens} from '../com/feeds/ProfileFeedgens'
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
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
import {cleanError} from '#/lib/strings/errors'
import {LoadLatestBtn} from '../com/util/load-latest/LoadLatestBtn'
import {useQueryClient} from '@tanstack/react-query'
import {useComposerControls} from '#/state/shell/composer'
import {listenSoftReset} from '#/state/events'
import {truncateAndInvalidate} from '#/state/queries/util'
import {Text} from '#/view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {isNative} from '#/platform/detection'

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export function ProfileScreen({route}: Props) {
  const {currentAccount} = useSession()
  const name =
    route.params.name === 'me' ? currentAccount?.did : route.params.name
  const moderationOpts = useModerationOpts()
  const {
    data: resolvedDid,
    error: resolveError,
    refetch: refetchDid,
    isInitialLoading: isInitialLoadingDid,
  } = useResolveDidQuery(name)
  const {
    data: profile,
    error: profileError,
    refetch: refetchProfile,
    isInitialLoading: isInitialLoadingProfile,
  } = useProfileQuery({
    did: resolvedDid,
  })

  const onPressTryAgain = React.useCallback(() => {
    if (resolveError) {
      refetchDid()
    } else {
      refetchProfile()
    }
  }, [resolveError, refetchDid, refetchProfile])

  if (isInitialLoadingDid || isInitialLoadingProfile || !moderationOpts) {
    return (
      <CenteredView>
        <ProfileHeader
          profile={null}
          moderation={null}
          isProfilePreview={true}
        />
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
}

function ProfileScreenLoaded({
  profile: profileUnshadowed,
  moderationOpts,
  hideBackButton,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  hideBackButton: boolean
}) {
  const profile = useProfileShadow(profileUnshadowed)
  const {hasSession, currentAccount} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {openComposer} = useComposerControls()
  const {screen, track} = useAnalytics()
  const [currentPage, setCurrentPage] = React.useState(0)
  const {_} = useLingui()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const extraInfoQuery = useProfileExtraInfoQuery(profile.did)
  const postsSectionRef = React.useRef<SectionRef>(null)
  const repliesSectionRef = React.useRef<SectionRef>(null)
  const mediaSectionRef = React.useRef<SectionRef>(null)
  const likesSectionRef = React.useRef<SectionRef>(null)
  const feedsSectionRef = React.useRef<SectionRef>(null)
  const listsSectionRef = React.useRef<SectionRef>(null)

  useSetTitle(combinedDisplayName(profile))

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  const isMe = profile.did === currentAccount?.did
  const showRepliesTab = hasSession
  const showLikesTab = isMe
  const showFeedsTab = isMe || extraInfoQuery.data?.hasFeedgens
  const showListsTab = hasSession && (isMe || extraInfoQuery.data?.hasLists)
  const sectionTitles = useMemo<string[]>(() => {
    return [
      _(msg`Posts`),
      showRepliesTab ? _(msg`Replies`) : undefined,
      _(msg`Media`),
      showLikesTab ? _(msg`Likes`) : undefined,
      showFeedsTab ? _(msg`Feeds`) : undefined,
      showListsTab ? _(msg`Lists`) : undefined,
    ].filter(Boolean) as string[]
  }, [showRepliesTab, showLikesTab, showFeedsTab, showListsTab, _])

  let nextIndex = 0
  const postsIndex = nextIndex++
  let repliesIndex: number | null = null
  if (showRepliesTab) {
    repliesIndex = nextIndex++
  }
  const mediaIndex = nextIndex++
  let likesIndex: number | null = null
  if (showLikesTab) {
    likesIndex = nextIndex++
  }
  let feedsIndex: number | null = null
  if (showFeedsTab) {
    feedsIndex = nextIndex++
  }
  let listsIndex: number | null = null
  if (showListsTab) {
    listsIndex = nextIndex++
  }

  const scrollSectionToTop = React.useCallback(
    (index: number) => {
      if (index === postsIndex) {
        postsSectionRef.current?.scrollToTop()
      } else if (index === repliesIndex) {
        repliesSectionRef.current?.scrollToTop()
      } else if (index === mediaIndex) {
        mediaSectionRef.current?.scrollToTop()
      } else if (index === likesIndex) {
        likesSectionRef.current?.scrollToTop()
      } else if (index === feedsIndex) {
        feedsSectionRef.current?.scrollToTop()
      } else if (index === listsIndex) {
        listsSectionRef.current?.scrollToTop()
      }
    },
    [postsIndex, repliesIndex, mediaIndex, likesIndex, feedsIndex, listsIndex],
  )

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      screen('Profile')
      return listenSoftReset(() => {
        scrollSectionToTop(currentPage)
      })
    }, [setMinimalShellMode, screen, currentPage, scrollSectionToTop]),
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
    openComposer({mention})
  }, [openComposer, currentAccount, track, profile])

  const onPageSelected = React.useCallback(
    (i: number) => {
      setCurrentPage(i)
    },
    [setCurrentPage],
  )

  const onCurrentPageSelected = React.useCallback(
    (index: number) => {
      scrollSectionToTop(index)
    },
    [scrollSectionToTop],
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
        testID="profilePager"
        isHeaderReady={true}
        items={sectionTitles}
        onPageSelected={onPageSelected}
        onCurrentPageSelected={onCurrentPageSelected}
        renderHeader={renderHeader}>
        {({onScroll, headerHeight, isFocused, isScrolledDown, scrollElRef}) => (
          <FeedSection
            ref={postsSectionRef}
            feed={`author|${profile.did}|posts_and_author_threads`}
            onScroll={onScroll}
            headerHeight={headerHeight}
            isFocused={isFocused}
            isScrolledDown={isScrolledDown}
            scrollElRef={scrollElRef as ListRef}
            ignoreFilterFor={profile.did}
          />
        )}
        {showRepliesTab
          ? ({
              onScroll,
              headerHeight,
              isFocused,
              isScrolledDown,
              scrollElRef,
            }) => (
              <FeedSection
                ref={repliesSectionRef}
                feed={`author|${profile.did}|posts_with_replies`}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isFocused={isFocused}
                isScrolledDown={isScrolledDown}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
              />
            )
          : null}
        {({onScroll, headerHeight, isFocused, isScrolledDown, scrollElRef}) => (
          <FeedSection
            ref={mediaSectionRef}
            feed={`author|${profile.did}|posts_with_media`}
            onScroll={onScroll}
            headerHeight={headerHeight}
            isFocused={isFocused}
            isScrolledDown={isScrolledDown}
            scrollElRef={scrollElRef as ListRef}
            ignoreFilterFor={profile.did}
          />
        )}
        {showLikesTab
          ? ({
              onScroll,
              headerHeight,
              isFocused,
              isScrolledDown,
              scrollElRef,
            }) => (
              <FeedSection
                ref={likesSectionRef}
                feed={`likes|${profile.did}`}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isFocused={isFocused}
                isScrolledDown={isScrolledDown}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
              />
            )
          : null}
        {showFeedsTab
          ? ({onScroll, headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedgens
                ref={feedsSectionRef}
                did={profile.did}
                scrollElRef={scrollElRef as ListRef}
                onScroll={onScroll}
                scrollEventThrottle={1}
                headerOffset={headerHeight}
                enabled={isFocused}
              />
            )
          : null}
        {showListsTab
          ? ({onScroll, headerHeight, isFocused, scrollElRef}) => (
              <ProfileLists
                ref={listsSectionRef}
                did={profile.did}
                scrollElRef={scrollElRef as ListRef}
                onScroll={onScroll}
                scrollEventThrottle={1}
                headerOffset={headerHeight}
                enabled={isFocused}
              />
            )
          : null}
      </PagerWithHeader>
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </ScreenHider>
  )
}

interface FeedSectionProps {
  feed: FeedDescriptor
  onScroll: OnScrollHandler
  headerHeight: number
  isFocused: boolean
  isScrolledDown: boolean
  scrollElRef: ListRef
  ignoreFilterFor?: string
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {
      feed,
      onScroll,
      headerHeight,
      isFocused,
      isScrolledDown,
      scrollElRef,
      ignoreFilterFor,
    },
    ref,
  ) {
    const queryClient = useQueryClient()
    const [hasNew, setHasNew] = React.useState(false)

    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
    }, [scrollElRef, headerHeight, queryClient, feed, setHasNew])
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
          enabled={isFocused}
          feed={feed}
          scrollElRef={scrollElRef}
          onHasNew={setHasNew}
          onScroll={onScroll}
          scrollEventThrottle={1}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
          renderEndOfFeed={ProfileEndOfFeed}
          ignoreFilterFor={ignoreFilterFor}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Load new posts"
            showIndicator={hasNew}
          />
        )}
      </View>
    )
  },
)

function ProfileEndOfFeed() {
  const pal = usePalette('default')

  return (
    <View style={[pal.border, {paddingTop: 32, borderTopWidth: 1}]}>
      <Text style={[pal.textLight, pal.border, {textAlign: 'center'}]}>
        <Trans>End of feed</Trans>
      </Text>
    </View>
  )
}

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
