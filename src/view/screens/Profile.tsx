import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {combinedDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {isInvalidHandle} from '#/lib/strings/handles'
import {colors, s} from '#/lib/styles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {listenSoftReset} from '#/state/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useLabelerInfoQuery} from '#/state/queries/labeler'
import {resetProfilePostsQueries} from '#/state/queries/post-feed'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useAgent, useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {ProfileFeedgens} from '#/view/com/feeds/ProfileFeedgens'
import {ProfileLists} from '#/view/com/lists/ProfileLists'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListRef} from '#/view/com/util/List'
import {ProfileHeader, ProfileHeaderLoading} from '#/screens/Profile/Header'
import {ProfileFeedSection} from '#/screens/Profile/Sections/Feed'
import {ProfileLabelsSection} from '#/screens/Profile/Sections/Labels'
import {atoms as a} from '#/alf'
import {Circle_And_Square_Stroke1_Corner0_Rounded_Filled as CircleAndSquareIcon} from '#/components/icons/CircleAndSquare'
import {Heart2_Stroke1_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Image_Stroke1_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Message_Stroke1_Corner0_Rounded_Filled as MessageIcon} from '#/components/icons/Message'
import {VideoClip_Stroke1_Corner0_Rounded as VideoIcon} from '#/components/icons/VideoClip'
import * as Layout from '#/components/Layout'
import {ScreenHider} from '#/components/moderation/ScreenHider'
import {ProfileStarterPacks} from '#/components/StarterPack/ProfileStarterPacks'
import {navigate} from '#/Navigation'
import {ExpoScrollForwarderView} from '../../../modules/expo-scroll-forwarder'

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export function ProfileScreen(props: Props) {
  return (
    <Layout.Screen testID="profileScreen" style={[a.pt_0]}>
      <ProfileScreenInner {...props} />
    </Layout.Screen>
  )
}

function ProfileScreenInner({route}: Props) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const name =
    route.params.name === 'me' ? currentAccount?.did : route.params.name
  const moderationOpts = useModerationOpts()
  const {
    data: resolvedDid,
    error: resolveError,
    refetch: refetchDid,
    isPending: isDidPending,
  } = useResolveDidQuery(name)
  const {
    data: profile,
    error: profileError,
    refetch: refetchProfile,
    isPlaceholderData: isPlaceholderProfile,
    isPending: isProfilePending,
  } = useProfileQuery({
    did: resolvedDid,
  })

  const onPressTryAgain = useCallback(() => {
    if (resolveError) {
      void refetchDid()
    } else {
      void refetchProfile()
    }
  }, [resolveError, refetchDid, refetchProfile])

  // Apply hard-coded redirects as need
  useEffect(() => {
    if (resolveError) {
      if (name === 'lulaoficial.bsky.social') {
        console.log('Applying redirect to lula.com.br')
        void navigate('Profile', {name: 'lula.com.br'})
      }
    }
  }, [name, resolveError])

  // When we open the profile, we want to reset the posts query if we are blocked.
  useEffect(() => {
    if (resolvedDid && profile?.viewer?.blockedBy) {
      resetProfilePostsQueries(queryClient, resolvedDid)
    }
  }, [queryClient, profile?.viewer?.blockedBy, resolvedDid])

  // Most pushes will happen here, since we will have only placeholder data
  if (isDidPending || isProfilePending) {
    return (
      <Layout.Content>
        <ProfileHeaderLoading />
      </Layout.Content>
    )
  }
  if (resolveError || profileError) {
    return (
      <SafeAreaView style={[a.flex_1]}>
        <ErrorScreen
          testID="profileErrorScreen"
          title={profileError ? _(msg`Not Found`) : _(msg`Oops!`)}
          message={cleanError(resolveError || profileError)}
          onPressTryAgain={onPressTryAgain}
          showHeader
        />
      </SafeAreaView>
    )
  }
  if (profile && moderationOpts) {
    return (
      <ProfileScreenLoaded
        profile={profile}
        moderationOpts={moderationOpts}
        isPlaceholderProfile={isPlaceholderProfile}
        hideBackButton={!!route.params.hideBackButton}
      />
    )
  }
  // should never happen
  return (
    <SafeAreaView style={[a.flex_1]}>
      <ErrorScreen
        testID="profileErrorScreen"
        title="Oops!"
        message="Something went wrong and we're not sure what."
        onPressTryAgain={onPressTryAgain}
        showHeader
      />
    </SafeAreaView>
  )
}

function ProfileScreenLoaded({
  profile: profileUnshadowed,
  isPlaceholderProfile,
  moderationOpts,
  hideBackButton,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  hideBackButton: boolean
  isPlaceholderProfile: boolean
}) {
  const profile = useProfileShadow(profileUnshadowed)
  const {hasSession, currentAccount} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {openComposer} = useOpenComposer()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()
  const {
    data: labelerInfo,
    error: labelerError,
    isLoading: isLabelerLoading,
  } = useLabelerInfoQuery({
    did: profile.did,
    enabled: !!profile.associated?.labeler,
  })
  const [currentPage, setCurrentPage] = useState(0)
  const {_} = useLingui()

  const [scrollViewTag, setScrollViewTag] = useState<number | null>(null)

  const postsSectionRef = useRef<SectionRef>(null)
  const repliesSectionRef = useRef<SectionRef>(null)
  const mediaSectionRef = useRef<SectionRef>(null)
  const videosSectionRef = useRef<SectionRef>(null)
  const likesSectionRef = useRef<SectionRef>(null)
  const feedsSectionRef = useRef<SectionRef>(null)
  const listsSectionRef = useRef<SectionRef>(null)
  const starterPacksSectionRef = useRef<SectionRef>(null)
  const labelsSectionRef = useRef<SectionRef>(null)

  useSetTitle(combinedDisplayName(profile))

  const description = profile.description ?? ''
  const hasDescription = description !== ''
  const [descriptionRT, isResolvingDescriptionRT] = useRichText(description)
  const showPlaceholder = isPlaceholderProfile || isResolvingDescriptionRT
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  const isMe = profile.did === currentAccount?.did
  const hasLabeler = !!profile.associated?.labeler
  const showFiltersTab = hasLabeler
  const showPostsTab = true
  const showRepliesTab = hasSession
  const showMediaTab = !hasLabeler
  const showVideosTab = !hasLabeler
  const showLikesTab = isMe
  const feedGenCount = profile.associated?.feedgens || 0
  const showFeedsTab = isMe || feedGenCount > 0
  const starterPackCount = profile.associated?.starterPacks || 0
  const showStarterPacksTab = isMe || starterPackCount > 0
  // subtract starterpack count from list count, since starterpacks are a type of list
  const listCount = (profile.associated?.lists || 0) - starterPackCount
  const showListsTab = hasSession && (isMe || listCount > 0)

  const sectionTitles = [
    showFiltersTab ? _(msg`Labels`) : undefined,
    showListsTab && hasLabeler ? _(msg`Lists`) : undefined,
    showPostsTab ? _(msg`Posts`) : undefined,
    showRepliesTab ? _(msg`Replies`) : undefined,
    showMediaTab ? _(msg`Media`) : undefined,
    showVideosTab ? _(msg`Videos`) : undefined,
    showLikesTab ? _(msg`Likes`) : undefined,
    showFeedsTab ? _(msg`Feeds`) : undefined,
    showStarterPacksTab ? _(msg`Starter Packs`) : undefined,
    showListsTab && !hasLabeler ? _(msg`Lists`) : undefined,
  ].filter(Boolean) as string[]

  let nextIndex = 0
  let filtersIndex: number | null = null
  let postsIndex: number | null = null
  let repliesIndex: number | null = null
  let mediaIndex: number | null = null
  let videosIndex: number | null = null
  let likesIndex: number | null = null
  let feedsIndex: number | null = null
  let starterPacksIndex: number | null = null
  let listsIndex: number | null = null
  if (showFiltersTab) {
    filtersIndex = nextIndex++
  }
  if (showPostsTab) {
    postsIndex = nextIndex++
  }
  if (showRepliesTab) {
    repliesIndex = nextIndex++
  }
  if (showMediaTab) {
    mediaIndex = nextIndex++
  }
  if (showVideosTab) {
    videosIndex = nextIndex++
  }
  if (showLikesTab) {
    likesIndex = nextIndex++
  }
  if (showFeedsTab) {
    feedsIndex = nextIndex++
  }
  if (showStarterPacksTab) {
    starterPacksIndex = nextIndex++
  }
  if (showListsTab) {
    listsIndex = nextIndex++
  }

  const scrollSectionToTop = useCallback(
    (index: number) => {
      if (index === filtersIndex) {
        labelsSectionRef.current?.scrollToTop()
      } else if (index === postsIndex) {
        postsSectionRef.current?.scrollToTop()
      } else if (index === repliesIndex) {
        repliesSectionRef.current?.scrollToTop()
      } else if (index === mediaIndex) {
        mediaSectionRef.current?.scrollToTop()
      } else if (index === videosIndex) {
        videosSectionRef.current?.scrollToTop()
      } else if (index === likesIndex) {
        likesSectionRef.current?.scrollToTop()
      } else if (index === feedsIndex) {
        feedsSectionRef.current?.scrollToTop()
      } else if (index === starterPacksIndex) {
        starterPacksSectionRef.current?.scrollToTop()
      } else if (index === listsIndex) {
        listsSectionRef.current?.scrollToTop()
      }
    },
    [
      filtersIndex,
      postsIndex,
      repliesIndex,
      mediaIndex,
      videosIndex,
      likesIndex,
      feedsIndex,
      listsIndex,
      starterPacksIndex,
    ],
  )

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
      return listenSoftReset(() => {
        scrollSectionToTop(currentPage)
      })
    }, [setMinimalShellMode, currentPage, scrollSectionToTop]),
  )

  // events
  // =

  const onPressCompose = () => {
    const mention =
      profile.handle === currentAccount?.handle ||
      isInvalidHandle(profile.handle)
        ? undefined
        : profile.handle
    openComposer({mention, logContext: 'ProfileFeed'})
  }

  const onPageSelected = (i: number) => {
    setCurrentPage(i)
  }

  const onCurrentPageSelected = (index: number) => {
    scrollSectionToTop(index)
  }

  const navToWizard = useCallback(() => {
    navigation.navigate('StarterPackWizard', {})
  }, [navigation])
  const wrappedNavToWizard = requireEmailVerification(navToWizard, {
    instructions: [
      <Trans key="nav">
        Before creating a starter pack, you must first verify your email.
      </Trans>,
    ],
  })

  // rendering
  // =

  const renderHeader = ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => {
    return (
      <ExpoScrollForwarderView scrollViewTag={scrollViewTag}>
        <ProfileHeader
          profile={profile}
          labeler={labelerInfo}
          descriptionRT={hasDescription ? descriptionRT : null}
          moderationOpts={moderationOpts}
          hideBackButton={hideBackButton}
          isPlaceholderProfile={showPlaceholder}
          setMinimumHeight={setMinimumHeight}
        />
      </ExpoScrollForwarderView>
    )
  }

  return (
    <ScreenHider
      testID="profileView"
      style={styles.container}
      screenDescription={_(msg`profile`)}
      modui={moderation.ui('profileView')}>
      <PagerWithHeader
        testID="profilePager"
        isHeaderReady={!showPlaceholder}
        items={sectionTitles}
        onPageSelected={onPageSelected}
        onCurrentPageSelected={onCurrentPageSelected}
        renderHeader={renderHeader}
        allowHeaderOverScroll>
        {showFiltersTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileLabelsSection
                ref={labelsSectionRef}
                labelerInfo={labelerInfo}
                labelerError={labelerError}
                isLabelerLoading={isLabelerLoading}
                moderationOpts={moderationOpts}
                scrollElRef={scrollElRef as ListRef}
                headerHeight={headerHeight}
                isFocused={isFocused}
                setScrollViewTag={setScrollViewTag}
              />
            )
          : null}
        {showListsTab && !!profile.associated?.labeler
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileLists
                ref={listsSectionRef}
                did={profile.did}
                scrollElRef={scrollElRef as ListRef}
                headerOffset={headerHeight}
                enabled={isFocused}
                setScrollViewTag={setScrollViewTag}
              />
            )
          : null}
        {showPostsTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedSection
                ref={postsSectionRef}
                feed={`author|${profile.did}|posts_and_author_threads`}
                headerHeight={headerHeight}
                isFocused={isFocused}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={_(msg`No posts yet`)}
                emptyStateButton={
                  isMe
                    ? {
                        label: _(msg`Write a post`),
                        text: _(msg`Write a post`),
                        onPress: () =>
                          openComposer({logContext: 'ProfileFeed'}),
                        size: 'small',
                        color: 'primary',
                      }
                    : undefined
                }
              />
            )
          : null}
        {showRepliesTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedSection
                ref={repliesSectionRef}
                feed={`author|${profile.did}|posts_with_replies`}
                headerHeight={headerHeight}
                isFocused={isFocused}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={_(msg`No replies yet`)}
                emptyStateIcon={MessageIcon}
              />
            )
          : null}
        {showMediaTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedSection
                ref={mediaSectionRef}
                feed={`author|${profile.did}|posts_with_media`}
                headerHeight={headerHeight}
                isFocused={isFocused}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={_(msg`No media yet`)}
                emptyStateButton={
                  isMe
                    ? {
                        label: _(msg`Post a photo`),
                        text: _(msg`Post a photo`),
                        onPress: () =>
                          openComposer({logContext: 'ProfileFeed'}),
                        size: 'small',
                        color: 'primary',
                      }
                    : undefined
                }
                emptyStateIcon={ImageIcon}
              />
            )
          : null}
        {showVideosTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedSection
                ref={videosSectionRef}
                feed={`author|${profile.did}|posts_with_video`}
                headerHeight={headerHeight}
                isFocused={isFocused}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={_(msg`No video posts yet`)}
                emptyStateButton={
                  isMe
                    ? {
                        label: _(msg`Post a video`),
                        text: _(msg`Post a video`),
                        onPress: () =>
                          openComposer({logContext: 'ProfileFeed'}),
                        size: 'small',
                        color: 'primary',
                      }
                    : undefined
                }
                emptyStateIcon={VideoIcon}
              />
            )
          : null}
        {showLikesTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedSection
                ref={likesSectionRef}
                feed={`likes|${profile.did}`}
                headerHeight={headerHeight}
                isFocused={isFocused}
                scrollElRef={scrollElRef as ListRef}
                ignoreFilterFor={profile.did}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={_(msg`No likes yet`)}
                emptyStateIcon={HeartIcon}
              />
            )
          : null}
        {showFeedsTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileFeedgens
                ref={feedsSectionRef}
                did={profile.did}
                scrollElRef={scrollElRef as ListRef}
                headerOffset={headerHeight}
                enabled={isFocused}
                setScrollViewTag={setScrollViewTag}
              />
            )
          : null}
        {showStarterPacksTab
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileStarterPacks
                ref={starterPacksSectionRef}
                did={profile.did}
                isMe={isMe}
                scrollElRef={scrollElRef as ListRef}
                headerOffset={headerHeight}
                enabled={isFocused}
                setScrollViewTag={setScrollViewTag}
                emptyStateMessage={
                  isMe
                    ? _(
                        msg`Starter Packs let you share your favorite feeds and people with your friends.`,
                      )
                    : _(msg`No Starter Packs yet`)
                }
                emptyStateButton={
                  isMe
                    ? {
                        label: _(msg`Create a Starter Pack`),
                        text: _(msg`Create a Starter Pack`),
                        onPress: wrappedNavToWizard,
                        color: 'primary',
                        size: 'small',
                      }
                    : undefined
                }
                emptyStateIcon={CircleAndSquareIcon}
              />
            )
          : null}
        {showListsTab && !profile.associated?.labeler
          ? ({headerHeight, isFocused, scrollElRef}) => (
              <ProfileLists
                ref={listsSectionRef}
                did={profile.did}
                scrollElRef={scrollElRef as ListRef}
                headerOffset={headerHeight}
                enabled={isFocused}
                setScrollViewTag={setScrollViewTag}
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

function useRichText(text: string): [RichTextAPI, boolean] {
  const agent = useAgent()
  const [prevText, setPrevText] = useState(text)
  const [rawRT, setRawRT] = useState(() => new RichTextAPI({text}))
  const [resolvedRT, setResolvedRT] = useState<RichTextAPI | null>(null)
  if (text !== prevText) {
    setPrevText(text)
    setRawRT(new RichTextAPI({text}))
    setResolvedRT(null)
    // This will queue an immediate re-render
  }
  useEffect(() => {
    let ignore = false
    async function resolveRTFacets() {
      // new each time
      const resolvedRT = new RichTextAPI({text})
      await resolvedRT.detectFacets(agent)
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    void resolveRTFacets()
    return () => {
      ignore = true
    }
  }, [text, agent])
  const isResolving = resolvedRT === null
  return [resolvedRT ?? rawRT, isResolving]
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
    // @ts-ignore Web-only.
    overflowAnchor: 'none', // Fixes jumps when switching tabs while scrolled down.
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
