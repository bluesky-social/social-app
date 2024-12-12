import React, {useCallback, useMemo} from 'react'
import {StyleSheet} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyGraphGetActorStarterPacks,
  moderateProfile,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {
  InfiniteData,
  UseInfiniteQueryResult,
  useQueryClient,
} from '@tanstack/react-query'

import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {combinedDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {isInvalidHandle} from '#/lib/strings/handles'
import {colors, s} from '#/lib/styles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {listenSoftReset} from '#/state/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorStarterPacksQuery} from '#/state/queries/actor-starter-packs'
import {useLabelerInfoQuery} from '#/state/queries/labeler'
import {resetProfilePostsQueries} from '#/state/queries/post-feed'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useAgent, useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {ProfileFeedgens} from '#/view/com/feeds/ProfileFeedgens'
import {ProfileLists} from '#/view/com/lists/ProfileLists'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {FAB} from '#/view/com/util/fab/FAB'
import {ListRef} from '#/view/com/util/List'
import {ProfileHeader, ProfileHeaderLoading} from '#/screens/Profile/Header'
import {ProfileFeedSection} from '#/screens/Profile/Sections/Feed'
import {ProfileLabelsSection} from '#/screens/Profile/Sections/Labels'
import {atoms as a} from '#/alf'
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
    isLoading: isLoadingDid,
  } = useResolveDidQuery(name)
  const {
    data: profile,
    error: profileError,
    refetch: refetchProfile,
    isLoading: isLoadingProfile,
    isPlaceholderData: isPlaceholderProfile,
  } = useProfileQuery({
    did: resolvedDid,
  })
  const starterPacksQuery = useActorStarterPacksQuery({did: resolvedDid})

  const onPressTryAgain = React.useCallback(() => {
    if (resolveError) {
      refetchDid()
    } else {
      refetchProfile()
    }
  }, [resolveError, refetchDid, refetchProfile])

  // Apply hard-coded redirects as need
  React.useEffect(() => {
    if (resolveError) {
      if (name === 'lulaoficial.bsky.social') {
        console.log('Applying redirect to lula.com.br')
        navigate('Profile', {name: 'lula.com.br'})
      }
    }
  }, [name, resolveError])

  // When we open the profile, we want to reset the posts query if we are blocked.
  React.useEffect(() => {
    if (resolvedDid && profile?.viewer?.blockedBy) {
      resetProfilePostsQueries(queryClient, resolvedDid)
    }
  }, [queryClient, profile?.viewer?.blockedBy, resolvedDid])

  // Most pushes will happen here, since we will have only placeholder data
  if (isLoadingDid || isLoadingProfile || starterPacksQuery.isLoading) {
    return (
      <Layout.Content>
        <ProfileHeaderLoading />
      </Layout.Content>
    )
  }
  if (resolveError || profileError) {
    return (
      <ErrorScreen
        testID="profileErrorScreen"
        title={profileError ? _(msg`Not Found`) : _(msg`Oops!`)}
        message={cleanError(resolveError || profileError)}
        onPressTryAgain={onPressTryAgain}
        showHeader
      />
    )
  }
  if (profile && moderationOpts) {
    return (
      <ProfileScreenLoaded
        profile={profile}
        starterPacksQuery={starterPacksQuery}
        moderationOpts={moderationOpts}
        isPlaceholderProfile={isPlaceholderProfile}
        hideBackButton={!!route.params.hideBackButton}
      />
    )
  }
  // should never happen
  return (
    <ErrorScreen
      testID="profileErrorScreen"
      title="Oops!"
      message="Something went wrong and we're not sure what."
      onPressTryAgain={onPressTryAgain}
      showHeader
    />
  )
}

function ProfileScreenLoaded({
  profile: profileUnshadowed,
  isPlaceholderProfile,
  moderationOpts,
  hideBackButton,
  starterPacksQuery,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  hideBackButton: boolean
  isPlaceholderProfile: boolean
  starterPacksQuery: UseInfiniteQueryResult<
    InfiniteData<AppBskyGraphGetActorStarterPacks.OutputSchema, unknown>,
    Error
  >
}) {
  const profile = useProfileShadow(profileUnshadowed)
  const {hasSession, currentAccount} = useSession()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {openComposer} = useComposerControls()
  const {
    data: labelerInfo,
    error: labelerError,
    isLoading: isLabelerLoading,
  } = useLabelerInfoQuery({
    did: profile.did,
    enabled: !!profile.associated?.labeler,
  })
  const [currentPage, setCurrentPage] = React.useState(0)
  const {_} = useLingui()

  const [scrollViewTag, setScrollViewTag] = React.useState<number | null>(null)

  const postsSectionRef = React.useRef<SectionRef>(null)
  const repliesSectionRef = React.useRef<SectionRef>(null)
  const mediaSectionRef = React.useRef<SectionRef>(null)
  const likesSectionRef = React.useRef<SectionRef>(null)
  const feedsSectionRef = React.useRef<SectionRef>(null)
  const listsSectionRef = React.useRef<SectionRef>(null)
  const starterPacksSectionRef = React.useRef<SectionRef>(null)
  const labelsSectionRef = React.useRef<SectionRef>(null)

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
  const showLikesTab = isMe
  const showFeedsTab = isMe || (profile.associated?.feedgens || 0) > 0
  const showStarterPacksTab =
    isMe || !!starterPacksQuery.data?.pages?.[0].starterPacks.length
  const showListsTab =
    hasSession && (isMe || (profile.associated?.lists || 0) > 0)

  const sectionTitles = [
    showFiltersTab ? _(msg`Labels`) : undefined,
    showListsTab && hasLabeler ? _(msg`Lists`) : undefined,
    showPostsTab ? _(msg`Posts`) : undefined,
    showRepliesTab ? _(msg`Replies`) : undefined,
    showMediaTab ? _(msg`Media`) : undefined,
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
      likesIndex,
      feedsIndex,
      listsIndex,
      starterPacksIndex,
    ],
  )

  useFocusEffect(
    React.useCallback(() => {
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
    openComposer({mention})
  }

  const onPageSelected = (i: number) => {
    setCurrentPage(i)
  }

  const onCurrentPageSelected = (index: number) => {
    scrollSectionToTop(index)
  }

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
                isMe={isMe}
                starterPacksQuery={starterPacksQuery}
                scrollElRef={scrollElRef as ListRef}
                headerOffset={headerHeight}
                enabled={isFocused}
                setScrollViewTag={setScrollViewTag}
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
  const [prevText, setPrevText] = React.useState(text)
  const [rawRT, setRawRT] = React.useState(() => new RichTextAPI({text}))
  const [resolvedRT, setResolvedRT] = React.useState<RichTextAPI | null>(null)
  if (text !== prevText) {
    setPrevText(text)
    setRawRT(new RichTextAPI({text}))
    setResolvedRT(null)
    // This will queue an immediate re-render
  }
  React.useEffect(() => {
    let ignore = false
    async function resolveRTFacets() {
      // new each time
      const resolvedRT = new RichTextAPI({text})
      await resolvedRT.detectFacets(agent)
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    resolveRTFacets()
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
