import React from 'react'
import {ScrollView, View} from 'react-native'
import Animated, {LinearTransition} from 'react-native-reanimated'
import {type AppBskyFeedDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {type FeedDescriptor} from '#/state/queries/post-feed'
import {useProfilesQuery} from '#/state/queries/profile'
import {
  useSuggestedFollowsByActorQuery,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {type SeenPost} from '#/state/userActionHistory'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {
  atoms as a,
  useBreakpoints,
  useTheme,
  type ViewStyleProp,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {InlineLinkText, Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {ProgressGuideList} from './ProgressGuide/List'

const DISMISS_ANIMATION_DURATION = 200

const MOBILE_CARD_WIDTH = 165
const FINAL_CARD_WIDTH = 120

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.flex_1,
        a.w_full,
        a.p_md,
        a.rounded_lg,
        a.border,
        t.atoms.bg,
        t.atoms.shadow_sm,
        t.atoms.border_contrast_low,
        !gtMobile && {
          width: MOBILE_CARD_WIDTH,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowPlaceholder() {
  return (
    <CardOuter>
      <ProfileCard.Outer>
        <View
          style={[a.flex_col, a.align_center, a.gap_sm, a.pb_sm, a.mb_auto]}>
          <ProfileCard.AvatarPlaceholder size={88} />
          <ProfileCard.NamePlaceholder />
          <View style={[a.w_full]}>
            <ProfileCard.DescriptionPlaceholder numberOfLines={2} />
          </View>
        </View>

        <ProfileCard.FollowButtonPlaceholder />
      </ProfileCard.Outer>
    </CardOuter>
  )
}

export function SuggestedFeedsCardPlaceholder() {
  return (
    <CardOuter style={[a.gap_sm]}>
      <FeedCard.Header>
        <FeedCard.AvatarPlaceholder />
        <FeedCard.TitleAndBylinePlaceholder creator />
      </FeedCard.Header>

      <FeedCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

function getRank(seenPost: SeenPost): string {
  let tier: string
  if (seenPost.feedContext === 'popfriends') {
    tier = 'a'
  } else if (seenPost.feedContext?.startsWith('cluster')) {
    tier = 'b'
  } else if (seenPost.feedContext === 'popcluster') {
    tier = 'c'
  } else if (seenPost.feedContext?.startsWith('ntpc')) {
    tier = 'd'
  } else if (seenPost.feedContext?.startsWith('t-')) {
    tier = 'e'
  } else if (seenPost.feedContext === 'nettop') {
    tier = 'f'
  } else {
    tier = 'g'
  }
  let score = Math.round(
    Math.log(
      1 + seenPost.likeCount + seenPost.repostCount + seenPost.replyCount,
    ),
  )
  if (seenPost.isFollowedBy || Math.random() > 0.9) {
    score *= 2
  }
  const rank = 100 - score
  return `${tier}-${rank}`
}

function sortSeenPosts(postA: SeenPost, postB: SeenPost): 0 | 1 | -1 {
  const rankA = getRank(postA)
  const rankB = getRank(postB)
  // Yes, we're comparing strings here.
  // The "larger" string means a worse rank.
  if (rankA > rankB) {
    return 1
  } else if (rankA < rankB) {
    return -1
  } else {
    return 0
  }
}

function useExperimentalSuggestedUsersQuery() {
  const {currentAccount} = useSession()
  const userActionSnapshot = userActionHistory.useActionHistorySnapshot()
  const dids = React.useMemo(() => {
    const {likes, follows, followSuggestions, seen} = userActionSnapshot
    const likeDids = likes
      .map(l => new AtUri(l))
      .map(uri => uri.host)
      .filter(did => !follows.includes(did))
    let suggestedDids: string[] = []
    if (followSuggestions.length > 0) {
      suggestedDids = [
        // It's ok if these will pick the same item (weighed by its frequency)
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
      ]
    }
    const seenDids = seen
      .sort(sortSeenPosts)
      .map(l => new AtUri(l.uri))
      .map(uri => uri.host)
    return [...new Set([...suggestedDids, ...likeDids, ...seenDids])].filter(
      did => did !== currentAccount?.did,
    )
  }, [userActionSnapshot, currentAccount])
  const {data, isLoading, error} = useProfilesQuery({
    handles: dids.slice(0, 16),
  })

  const profiles = data
    ? data.profiles.filter(profile => {
        return !profile.viewer?.following
      })
    : []

  return {
    isLoading,
    error,
    profiles: profiles.slice(0, 6),
  }
}

export function SuggestedFollows({feed}: {feed: FeedDescriptor}) {
  const {currentAccount} = useSession()
  const [feedType, feedUriOrDid] = feed.split('|')
  if (feedType === 'author') {
    if (currentAccount?.did === feedUriOrDid) {
      return null
    } else {
      return <SuggestedFollowsProfile did={feedUriOrDid} />
    }
  } else {
    return <SuggestedFollowsHome />
  }
}

export function SuggestedFollowsProfile({did}: {did: string}) {
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const maxLength = gtMobile ? 4 : 6
  const {
    isLoading: isSuggestionsLoading,
    data,
    error,
  } = useSuggestedFollowsByActorQuery({
    did,
  })
  const {
    data: moreSuggestions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuggestedFollowsQuery({limit: 25})

  const [dismissedDids, setDismissedDids] = React.useState<Set<string>>(
    new Set(),
  )
  const [dismissingDids, setDismissingDids] = React.useState<Set<string>>(
    new Set(),
  )

  const onDismiss = React.useCallback((dismissedDid: string) => {
    // Start the fade animation
    setDismissingDids(prev => new Set(prev).add(dismissedDid))
    // After animation completes, actually remove from list
    setTimeout(() => {
      setDismissedDids(prev => new Set(prev).add(dismissedDid))
      setDismissingDids(prev => {
        const next = new Set(prev)
        next.delete(dismissedDid)
        return next
      })
    }, DISMISS_ANIMATION_DURATION)
  }, [])

  // Combine profiles from the actor-specific query with fallback suggestions
  const allProfiles = React.useMemo(() => {
    const actorProfiles = data?.suggestions ?? []
    const fallbackProfiles =
      moreSuggestions?.pages.flatMap(page => page.actors) ?? []

    // Dedupe by did, preferring actor-specific profiles
    const seen = new Set<string>()
    const combined: bsky.profile.AnyProfileView[] = []

    for (const profile of actorProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    for (const profile of fallbackProfiles) {
      if (!seen.has(profile.did) && profile.did !== did) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    return combined
  }, [data?.suggestions, moreSuggestions?.pages, did])

  const filteredProfiles = React.useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.did))
  }, [allProfiles, dismissedDids])

  // Fetch more when running low
  React.useEffect(() => {
    if (
      moderationOpts &&
      filteredProfiles.length < maxLength &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    filteredProfiles.length,
    maxLength,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    moderationOpts,
  ])

  return (
    <ProfileGrid
      isSuggestionsLoading={isSuggestionsLoading}
      profiles={filteredProfiles}
      totalProfileCount={allProfiles.length}
      recId={data?.recId}
      error={error}
      viewContext="profile"
      onDismiss={onDismiss}
      dismissingDids={dismissingDids}
    />
  )
}

export function SuggestedFollowsHome() {
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const maxLength = gtMobile ? 4 : 6
  const {
    isLoading: isSuggestionsLoading,
    profiles: experimentalProfiles,
    error: experimentalError,
  } = useExperimentalSuggestedUsersQuery()
  const {
    data: moreSuggestions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: suggestionsError,
  } = useSuggestedFollowsQuery({limit: 25})

  const [dismissedDids, setDismissedDids] = React.useState<Set<string>>(
    new Set(),
  )
  const [dismissingDids, setDismissingDids] = React.useState<Set<string>>(
    new Set(),
  )

  const onDismiss = React.useCallback((did: string) => {
    // Start the fade animation
    setDismissingDids(prev => new Set(prev).add(did))
    // After animation completes, actually remove from list
    setTimeout(() => {
      setDismissedDids(prev => new Set(prev).add(did))
      setDismissingDids(prev => {
        const next = new Set(prev)
        next.delete(did)
        return next
      })
    }, DISMISS_ANIMATION_DURATION)
  }, [])

  // Combine profiles from experimental query with paginated suggestions
  const allProfiles = React.useMemo(() => {
    const fallbackProfiles =
      moreSuggestions?.pages.flatMap(page => page.actors) ?? []

    // Dedupe by did, preferring experimental profiles
    const seen = new Set<string>()
    const combined: bsky.profile.AnyProfileView[] = []

    for (const profile of experimentalProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    for (const profile of fallbackProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    return combined
  }, [experimentalProfiles, moreSuggestions?.pages])

  const filteredProfiles = React.useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.did))
  }, [allProfiles, dismissedDids])

  // Fetch more when running low
  React.useEffect(() => {
    if (
      moderationOpts &&
      filteredProfiles.length < maxLength &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    filteredProfiles.length,
    maxLength,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    moderationOpts,
  ])

  return (
    <ProfileGrid
      isSuggestionsLoading={isSuggestionsLoading}
      profiles={filteredProfiles}
      totalProfileCount={allProfiles.length}
      error={experimentalError || suggestionsError}
      viewContext="feed"
      onDismiss={onDismiss}
      dismissingDids={dismissingDids}
    />
  )
}

export function ProfileGrid({
  isSuggestionsLoading,
  error,
  profiles,
  totalProfileCount,
  recId,
  viewContext = 'feed',
  onDismiss,
  dismissingDids,
}: {
  isSuggestionsLoading: boolean
  profiles: bsky.profile.AnyProfileView[]
  totalProfileCount?: number
  recId?: number
  error: Error | null
  dismissingDids?: Set<string>
  viewContext: 'profile' | 'profileHeader' | 'feed'
  onDismiss?: (did: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const {gtMobile} = useBreakpoints()

  const isLoading = isSuggestionsLoading || !moderationOpts
  const isProfileHeaderContext = viewContext === 'profileHeader'
  const isFeedContext = viewContext === 'feed'

  const maxLength = gtMobile ? 3 : isProfileHeaderContext ? 12 : 6
  const minLength = gtMobile ? 3 : 4

  const content = isLoading
    ? Array(maxLength)
        .fill(0)
        .map((_, i) => (
          <View
            key={i}
            style={[
              a.flex_1,
              gtMobile &&
                web([
                  a.flex_0,
                  a.flex_grow,
                  {width: `calc(30% - ${a.gap_md.gap / 2}px)`},
                ]),
            ]}>
            <SuggestedFollowPlaceholder />
          </View>
        ))
    : error || !profiles.length
      ? null
      : profiles.slice(0, maxLength).map((profile, index) => (
          <Animated.View
            key={profile.did}
            layout={LinearTransition.duration(200)}
            style={[
              a.flex_1,
              gtMobile &&
                web([
                  a.flex_0,
                  a.flex_grow,
                  {width: `calc(30% - ${a.gap_md.gap / 2}px)`},
                ]),
              {
                opacity: dismissingDids?.has(profile.did) ? 0 : 1,
                transitionProperty: 'opacity',
                transitionDuration: `${DISMISS_ANIMATION_DURATION}ms`,
              },
            ]}>
            <ProfileCard.Link
              profile={profile}
              onPress={() => {
                logEvent('suggestedUser:press', {
                  logContext: isFeedContext
                    ? 'InterstitialDiscover'
                    : 'InterstitialProfile',
                  recId,
                  position: index,
                })
              }}>
              {({hovered, pressed}) => (
                <CardOuter
                  style={[
                    (hovered || pressed) && t.atoms.border_contrast_high,
                  ]}>
                  <ProfileCard.Outer>
                    {onDismiss && (
                      <Button
                        label={_(msg`Dismiss this suggestion`)}
                        onPress={e => {
                          e.preventDefault()
                          onDismiss(profile.did)
                          logEvent('suggestedUser:dismiss', {
                            logContext: isFeedContext
                              ? 'InterstitialDiscover'
                              : 'InterstitialProfile',
                            position: index,
                          })
                        }}
                        hitSlop={6}
                        style={[a.absolute, a.z_10, {top: -6, right: -6}]}>
                        {({
                          hovered: dismissHovered,
                          pressed: dismissPressed,
                        }) => (
                          <View
                            style={[
                              a.justify_center,
                              a.align_center,
                              a.rounded_full,
                              t.atoms.bg_contrast_50,
                              {width: 20, height: 20},
                              (dismissHovered || dismissPressed) &&
                                t.atoms.bg_contrast_100,
                            ]}>
                            <X
                              size="xs"
                              fill={t.atoms.text_contrast_medium.color}
                            />
                          </View>
                        )}
                      </Button>
                    )}
                    <View
                      style={[
                        a.flex_col,
                        a.align_center,
                        a.gap_sm,
                        a.pb_sm,
                        a.mb_auto,
                      ]}>
                      <ProfileCard.Avatar
                        profile={profile}
                        moderationOpts={moderationOpts}
                        disabledPreview
                        size={88}
                      />
                      <View style={[a.flex_col, a.align_center, a.max_w_full]}>
                        <ProfileCard.Name
                          profile={profile}
                          moderationOpts={moderationOpts}
                        />
                        <ProfileCard.Description
                          profile={profile}
                          numberOfLines={2}
                          style={[
                            t.atoms.text_contrast_medium,
                            a.text_center,
                            a.text_xs,
                          ]}
                        />
                      </View>
                    </View>

                    <ProfileCard.FollowButton
                      profile={profile}
                      moderationOpts={moderationOpts}
                      logContext="FeedInterstitial"
                      withIcon={false}
                      style={[a.rounded_sm]}
                      onFollow={() => {
                        logEvent('suggestedUser:follow', {
                          logContext: isFeedContext
                            ? 'InterstitialDiscover'
                            : 'InterstitialProfile',
                          location: 'Card',
                          recId,
                          position: index,
                        })
                      }}
                    />
                  </ProfileCard.Outer>
                </CardOuter>
              )}
            </ProfileCard.Link>
          </Animated.View>
        ))

  // Use totalProfileCount (before dismissals) for minLength check on initial render.
  const profileCountForMinCheck = totalProfileCount ?? profiles.length
  if (error || (!isLoading && profileCountForMinCheck < minLength)) {
    logger.debug(`Not enough profiles to show suggested follows`)
    return null
  }

  return (
    <View
      style={[
        !isProfileHeaderContext && a.border_t,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}
      pointerEvents={isIOS ? 'auto' : 'box-none'}>
      <View
        style={[
          a.px_lg,
          a.pt_md,
          a.flex_row,
          a.align_center,
          a.justify_between,
        ]}
        pointerEvents={isIOS ? 'auto' : 'box-none'}>
        <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
          {isFeedContext ? (
            <Trans>Suggested for you</Trans>
          ) : (
            <Trans>Similar accounts</Trans>
          )}
        </Text>
        {!isProfileHeaderContext && (
          <InlineLinkText
            label={_(msg`See more suggested profiles on the Explore page`)}
            to="/search"
            onPress={() => {
              logger.metric('suggestedUser:seeMore', {
                logContext: isFeedContext ? 'Explore' : 'Profile',
              })
            }}>
            <Trans>See more</Trans>
          </InlineLinkText>
        )}
      </View>

      {gtMobile ? (
        <View style={[a.p_lg, a.pt_md]}>
          <View style={[a.flex_1, a.flex_row, a.flex_wrap, a.gap_md]}>
            {content}
          </View>
        </View>
      ) : (
        <BlockDrawerGesture>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[a.p_lg, a.pt_md, a.flex_row, a.gap_md]}
            snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
            decelerationRate="fast">
            {content}

            {!isProfileHeaderContext && <SeeMoreSuggestedProfilesCard />}
          </ScrollView>
        </BlockDrawerGesture>
      )}
    </View>
  )
}

function SeeMoreSuggestedProfilesCard() {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Link
      to="/search"
      color="primary"
      label={_(msg`Browse more accounts on the Explore page`)}
      onPress={() => {
        logger.metric('suggestedUser:seeMore', {
          logContext: 'Explore',
        })
      }}
      style={[
        a.flex_col,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        a.p_md,
        a.rounded_lg,
        t.atoms.shadow_sm,
        {width: FINAL_CARD_WIDTH},
      ]}>
      <ButtonIcon icon={ArrowRight} size="lg" />
      <ButtonText
        style={[a.text_md, a.font_medium, a.leading_snug, a.text_center]}>
        <Trans>See more</Trans>
      </ButtonText>
    </Link>
  )
}

export function SuggestedFeeds() {
  const numFeedsToDisplay = 3
  const t = useTheme()
  const {_} = useLingui()
  const {data, isLoading, error} = useGetPopularFeedsQuery({
    limit: numFeedsToDisplay,
  })
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()

  const feeds = React.useMemo(() => {
    const items: AppBskyFeedDefs.GeneratorView[] = []

    if (!data) return items

    for (const page of data.pages) {
      for (const feed of page.feeds) {
        items.push(feed)
      }
    }

    return items
  }, [data])

  const content = isLoading ? (
    Array(numFeedsToDisplay)
      .fill(0)
      .map((_, i) => <SuggestedFeedsCardPlaceholder key={i} />)
  ) : error || !feeds ? null : (
    <>
      {feeds.slice(0, numFeedsToDisplay).map(feed => (
        <FeedCard.Link
          key={feed.uri}
          view={feed}
          onPress={() => {
            logEvent('feed:interstitial:feedCard:press', {})
          }}>
          {({hovered, pressed}) => (
            <CardOuter
              style={[(hovered || pressed) && t.atoms.border_contrast_high]}>
              <FeedCard.Outer>
                <FeedCard.Header>
                  <FeedCard.Avatar src={feed.avatar} />
                  <FeedCard.TitleAndByline
                    title={feed.displayName}
                    creator={feed.creator}
                  />
                </FeedCard.Header>
                <FeedCard.Description
                  description={feed.description}
                  numberOfLines={3}
                />
              </FeedCard.Outer>
            </CardOuter>
          )}
        </FeedCard.Link>
      ))}
    </>
  )

  return error ? null : (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View style={[a.pt_2xl, a.px_lg, a.flex_row, a.pb_xs]}>
        <Text
          style={[
            a.flex_1,
            a.text_lg,
            a.font_semi_bold,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Some other feeds you might like</Trans>
        </Text>
        <Hashtag fill={t.atoms.text_contrast_low.color} />
      </View>

      {gtMobile ? (
        <View style={[a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md]}>
          {content}

          <View
            style={[
              a.flex_row,
              a.justify_end,
              a.align_center,
              a.pt_xs,
              a.gap_md,
            ]}>
            <InlineLinkText
              label={_(msg`Browse more suggestions`)}
              to="/search"
              style={[t.atoms.text_contrast_medium]}>
              <Trans>Browse more suggestions</Trans>
            </InlineLinkText>
            <ArrowRight size="sm" fill={t.atoms.text_contrast_medium.color} />
          </View>
        </View>
      ) : (
        <BlockDrawerGesture>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
            decelerationRate="fast">
            <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
              {content}

              <Button
                label={_(msg`Browse more feeds on the Explore page`)}
                onPress={() => {
                  navigation.navigate('SearchTab')
                }}
                style={[a.flex_col]}>
                <CardOuter>
                  <View style={[a.flex_1, a.justify_center]}>
                    <View style={[a.flex_row, a.px_lg]}>
                      <Text style={[a.pr_xl, a.flex_1, a.leading_snug]}>
                        <Trans>
                          Browse more suggestions on the Explore page
                        </Trans>
                      </Text>

                      <ArrowRight size="xl" />
                    </View>
                  </View>
                </CardOuter>
              </Button>
            </View>
          </ScrollView>
        </BlockDrawerGesture>
      )}
    </View>
  )
}

export function ProgressGuide() {
  const t = useTheme()
  return (
    <View style={[t.atoms.border_contrast_low, a.px_lg, a.py_lg, a.pb_lg]}>
      <ProgressGuideList />
    </View>
  )
}
