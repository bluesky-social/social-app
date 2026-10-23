import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import {ScrollForwarderView} from '@bsky.app/react-native-scroll-forwarder'
import {moderateProfile, type ModerationOpts} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {combinedDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {isInvalidHandle} from '#/lib/strings/handles'
import {colors} from '#/lib/styles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {listenSoftReset} from '#/state/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useLabelerInfoQuery} from '#/state/queries/labeler'
import {resetProfilePostsQueries} from '#/state/queries/post-feed'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useAppviewClient, useSession} from '#/state/session'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListRef} from '#/view/com/util/List'
import {ProfileHeader, ProfileHeaderLoading} from '#/screens/Profile/Header'
import {getProfileBannerSafeAreaCoverHeight} from '#/screens/Profile/Header/layout'
import {ProfileTabPage} from '#/screens/Profile/ProfileTabPage'
import {type ProfileSection} from '#/screens/Profile/Sections/types'
import {useProfileFeedSection} from '#/screens/Profile/Sections/useProfileFeedSection'
import {useProfileFeedsSection} from '#/screens/Profile/Sections/useProfileFeedsSection'
import {useProfileLabelsSection} from '#/screens/Profile/Sections/useProfileLabelsSection'
import {useProfileListsSection} from '#/screens/Profile/Sections/useProfileListsSection'
import {useProfileStarterPacksSection} from '#/screens/Profile/Sections/useProfileStarterPacksSection'
import {
  type ProfileTabKey,
  profileTabKeys,
  profileTabMessages,
} from '#/screens/Profile/tabs'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Circle_And_Square_Stroke1_Corner0_Rounded_Filled as CircleAndSquareIcon} from '#/components/icons/CircleAndSquare'
import {EditBig_Stroke2_Corner2_Rounded as EditBigIcon} from '#/components/icons/EditBig'
import {Heart2_Stroke1_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Image_Stroke1_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Message_Stroke1_Corner0_Rounded_Filled as MessageIcon} from '#/components/icons/Message'
import {VideoClip_Stroke1_Corner0_Rounded as VideoIcon} from '#/components/icons/VideoClip'
import * as Layout from '#/components/Layout'
import {ScreenHider} from '#/components/moderation/ScreenHider'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {navigate} from '#/Navigation'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export function ProfileScreen(props: Props) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {top: topInset} = useSafeAreaInsets()
  const safeAreaCoverHeight = getProfileBannerSafeAreaCoverHeight({
    gtMobile,
    topInset,
  })

  return (
    <Layout.Screen testID="profileScreen" style={[a.pt_0]}>
      <ProfileScreenInner {...props} />
      {safeAreaCoverHeight > 0 && (
        <Layout.Center
          pointerEvents="none"
          style={[
            a.absolute,
            a.top_0,
            a.z_50,
            {height: safeAreaCoverHeight, alignSelf: 'center'},
            t.atoms.bg,
          ]}
        />
      )}
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
  // A disabled dependent query remains pending, so only consider the profile
  // pending once handle resolution has produced a DID.
  if (isDidPending || (!!resolvedDid && isProfilePending)) {
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
  profile: app.bsky.actor.defs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  hideBackButton: boolean
  isPlaceholderProfile: boolean
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {height: windowHeight} = useWindowDimensions()
  const profile = useProfileShadow(profileUnshadowed)
  const {hasSession, currentAccount} = useSession()
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
  const {_, i18n} = useLingui()

  const [scrollViewTag, setScrollViewTag] = useState<number | null>(null)
  /** The header's own height: everything above the tab strip. */
  const [headerContentHeight, setHeaderContentHeight] = useState(0)

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
  const feedGenCount = profile.associated?.feedgens || 0
  const starterPackCount = profile.associated?.starterPacks || 0
  // subtract starterpack count from list count, since starterpacks are a type of list
  const listCount = (profile.associated?.lists || 0) - starterPackCount

  const tabs = useMemo(
    () =>
      profileTabKeys({
        hasSession,
        isMe,
        hasLabeler,
        listCount,
        feedCount: feedGenCount,
        starterPackCount,
      }),
    [hasSession, isMe, hasLabeler, listCount, feedGenCount, starterPackCount],
  )

  /*
   * The pager owns which page is showing; the screen only needs to know which
   * tab that is, so that the header's pull-to-refresh and the soft reset know
   * what to refresh.
   */
  const [currentTab, setCurrentTab] = useState<ProfileTabKey>(() => tabs[0])
  const activeTab = tabs.includes(currentTab) ? currentTab : tabs[0]

  // Each page offers to scroll itself back to the top; the screen keeps the
  // one that is showing.
  const scrollToTopOf = useRef(new Map<ProfileTabKey, () => void>())

  const scrollActiveTabToTop = useCallback(() => {
    scrollToTopOf.current.get(activeTab)?.()
  }, [activeTab])

  const navToWizard = useCallback(() => {
    navigation.navigate('StarterPackWizard', {})
  }, [navigation])
  const wrappedNavToWizard = requireEmailVerification(navToWizard, {
    instructions: [
      <Trans key="nav">
        Before creating a Starter Pack, you must first verify your email.
      </Trans>,
    ],
  })

  // section contents
  // =
  //
  // Every tab asks for its own contents, but only the one that is showing is
  // enabled, so a profile fetches nothing it is not showing.

  const postsSection = useProfileFeedSection({
    feed: `author|${profile.did}|posts_and_author_threads`,
    enabled: activeTab === 'posts',
    ignoreFilterFor: profile.did,
    emptyStateMessage: _(msg`No posts yet`),
    emptyStateButton: isMe
      ? {
          label: _(msg`Write a post`),
          text: _(msg`Write a post`),
          onPress: () => openComposer({logContext: 'ProfileFeed'}),
          size: 'small',
          color: 'primary',
        }
      : undefined,
  })
  const repliesSection = useProfileFeedSection({
    feed: `author|${profile.did}|posts_with_replies`,
    enabled: activeTab === 'replies',
    ignoreFilterFor: profile.did,
    emptyStateMessage: _(msg`No replies yet`),
    emptyStateIcon: MessageIcon,
  })
  const mediaSection = useProfileFeedSection({
    feed: `author|${profile.did}|posts_with_media`,
    enabled: activeTab === 'media',
    ignoreFilterFor: profile.did,
    emptyStateMessage: _(msg`No media yet`),
    emptyStateButton: isMe
      ? {
          label: _(msg`Post a photo`),
          text: _(msg`Post a photo`),
          onPress: () => openComposer({logContext: 'ProfileFeed'}),
          size: 'small',
          color: 'primary',
        }
      : undefined,
    emptyStateIcon: ImageIcon,
  })
  const videosSection = useProfileFeedSection({
    feed: `author|${profile.did}|posts_with_video`,
    enabled: activeTab === 'videos',
    ignoreFilterFor: profile.did,
    emptyStateMessage: _(msg`No video posts yet`),
    emptyStateButton: isMe
      ? {
          label: _(msg`Post a video`),
          text: _(msg`Post a video`),
          onPress: () => openComposer({logContext: 'ProfileFeed'}),
          size: 'small',
          color: 'primary',
        }
      : undefined,
    emptyStateIcon: VideoIcon,
    isVideoFeed: IS_NATIVE,
  })
  const likesSection = useProfileFeedSection({
    feed: `likes|${profile.did}`,
    enabled: activeTab === 'likes',
    ignoreFilterFor: profile.did,
    emptyStateMessage: _(msg`No likes yet`),
    emptyStateIcon: HeartIcon,
  })
  const feedsSection = useProfileFeedsSection({
    did: profile.did,
    enabled: activeTab === 'feeds',
  })
  const listsSection = useProfileListsSection({
    did: profile.did,
    enabled: activeTab === 'lists',
  })
  const starterPacksSection = useProfileStarterPacksSection({
    did: profile.did,
    enabled: activeTab === 'starterPacks',
    isMe,
    emptyStateMessage: isMe
      ? _(
          msg`Starter Packs let you share your favorite feeds and people with your friends.`,
        )
      : _(msg`No Starter Packs yet`),
    emptyStateButton: isMe
      ? {
          label: _(msg`Create a Starter Pack`),
          text: _(msg`Create a Starter Pack`),
          onPress: wrappedNavToWizard,
          color: 'primary',
          size: 'small',
        }
      : undefined,
    emptyStateIcon: CircleAndSquareIcon,
  })
  const labelsSection = useProfileLabelsSection({
    isLabelerLoading,
    labelerInfo,
    labelerError,
    moderationOpts,
  })

  const sections: Record<ProfileTabKey, ProfileSection> = {
    labels: labelsSection,
    lists: listsSection,
    posts: postsSection,
    replies: repliesSection,
    media: mediaSection,
    videos: videosSection,
    likes: likesSection,
    feeds: feedsSection,
    starterPacks: starterPacksSection,
  }

  useFocusEffect(
    useCallback(() => {
      return listenSoftReset(() => {
        scrollActiveTabToTop()
      })
    }, [scrollActiveTabToTop]),
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
    const tab = tabs[i]
    if (tab) setCurrentTab(tab)
  }

  const onCurrentPageSelected = (_index: number) => {
    scrollActiveTabToTop()
  }

  /*
   * Pulling the header refreshes whichever tab is showing: the header is drawn
   * above the pages, so the gesture starts outside the list that would
   * otherwise handle it.
   */
  const onRefreshHeader = () => {
    sections[activeTab].onRefresh?.()
  }

  // rendering
  // =

  const renderHeader = ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => {
    return (
      <ScrollForwarderView
        scrollViewTag={scrollViewTag}
        refreshing={sections[activeTab].refreshing}
        onRefresh={onRefreshHeader}>
        {/*
         * The height is measured here, on the header itself, rather than left
         * to the pager measuring the wrapper around it: the wrapper is a native
         * view that reports more height than the header draws, which showed up
         * as a gap above the first row.
         */}
        <View
          onLayout={(e: LayoutChangeEvent) => {
            const height = Math.round(e.nativeEvent.layout.height * 2) / 2
            if (height > 0) setHeaderContentHeight(height)
          }}>
          <ProfileHeader
            profile={profile}
            labeler={labelerInfo}
            descriptionRT={hasDescription ? descriptionRT : null}
            moderationOpts={moderationOpts}
            hideBackButton={hideBackButton}
            isPlaceholderProfile={showPlaceholder}
            setMinimumHeight={setMinimumHeight}
          />
        </View>
      </ScrollForwarderView>
    )
  }

  return (
    <ScreenHider
      testID="profileView"
      style={styles.container}
      screenDescription={_(msg`user`)}
      modui={moderation.ui('profileView')}>
      <PagerWithHeader
        testID="profilePager"
        isHeaderReady={!showPlaceholder}
        items={tabs.map(key => i18n._(profileTabMessages[key]))}
        onPageSelected={onPageSelected}
        onCurrentPageSelected={onCurrentPageSelected}
        renderHeader={renderHeader}
        allowHeaderOverScroll
        headerOverflowInset={gtMobile ? windowHeight : undefined}
        headerContentHeight={headerContentHeight || undefined}>
        {tabs.map(tab => ({headerHeight, isFocused, scrollElRef}) => (
          <ProfileTabPage
            key={tab}
            section={sections[tab]}
            headerHeight={headerHeight}
            isFocused={isFocused}
            scrollElRef={scrollElRef as ListRef}
            setScrollViewTag={setScrollViewTag}
            registerScrollToTop={handle => {
              if (handle) {
                scrollToTopOf.current.set(tab, handle)
              } else {
                scrollToTopOf.current.delete(tab)
              }
            }}
          />
        ))}
      </PagerWithHeader>
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<EditBigIcon size="lg" fill={t.palette.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </ScreenHider>
  )
}

function useRichText(text: string): [RichTextAPI, boolean] {
  /*
   * Facet/mention resolution is an appview job - it resolves handles through
   * the appview, and the public fallback keeps it working when logged out.
   */
  const client = useAppviewClient()
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
      await resolvedRT.detectFacets(client)
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    void resolveRTFacets()
    return () => {
      ignore = true
    }
  }, [text, client])
  const isResolving = resolvedRT === null
  return [resolvedRT ?? rawRT, isResolving]
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
    // @ts-expect-error Web-only.
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
