import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ScrollView, View} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {type FeedDescriptor} from '#/state/queries/post-feed'
import {useSuggestedFollowsByActorWithDismiss} from '#/state/queries/suggested-follows'
import {useGetSuggestedUsersForDiscoverQuery} from '#/state/queries/trending/useGetSuggestedUsersForDiscoverQuery'
import {useSession} from '#/state/session'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {
  atoms as a,
  native,
  useBreakpoints,
  useTheme,
  type ViewStyleProp,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as FeedCard from '#/components/FeedCard'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {InlineLinkText} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'
import {type Metrics, useAnalytics} from '#/analytics'
import {IS_IOS} from '#/env'
import type * as bsky from '#/types/bsky'
import {FollowDialogWithoutGuide} from './ProgressGuide/FollowDialog'

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
      testID="CardOuter"
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
  const {profiles, recId, onDismiss, isLoading, error} =
    useSuggestedFollowsByActorWithDismiss({did})

  return (
    <ProfileGrid
      isSuggestionsLoading={isLoading}
      profiles={profiles}
      recId={recId}
      error={error}
      viewContext="profile"
      onDismiss={onDismiss}
    />
  )
}

export function SuggestedFollowsHome() {
  const {isLoading, data, error} = useGetSuggestedUsersForDiscoverQuery()

  const profiles = data?.actors

  const [dismissedDids, setDismissedDids] = useState<Set<string>>(new Set())

  const onDismiss = useCallback((did: string) => {
    setDismissedDids(prev => new Set(prev).add(did))
  }, [])

  const allProfiles = useMemo(() => {
    const result: Array<{
      actor: bsky.profile.AnyProfileView
      recId?: string
    }> = []

    for (const profile of profiles ?? []) {
      result.push({actor: profile, recId: data?.recId})
    }

    return result
  }, [data?.recId, profiles])

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.actor.did))
  }, [allProfiles, dismissedDids])

  return (
    <ProfileGrid
      recId={data?.recId}
      isSuggestionsLoading={isLoading}
      profiles={filteredProfiles}
      totalProfileCount={allProfiles.length}
      error={error}
      viewContext="feed"
      onDismiss={onDismiss}
    />
  )
}

export function ProfileGrid({
  isSuggestionsLoading,
  error,
  profiles,
  recId,
  totalProfileCount,
  viewContext = 'feed',
  onDismiss,
  isVisible = true,
  onRequestHide,
}: {
  isSuggestionsLoading: boolean
  profiles: {actor: bsky.profile.AnyProfileView; recId?: string}[]
  recId?: string
  totalProfileCount?: number
  error: Error | null
  viewContext: 'profile' | 'profileHeader' | 'feed'
  onDismiss?: (did: string) => void
  isVisible?: boolean
  onRequestHide?: () => void
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const {gtMobile} = useBreakpoints()
  const followDialogControl = useDialogControl()

  const isLoading = isSuggestionsLoading || !moderationOpts
  const isProfileHeaderContext = viewContext === 'profileHeader'
  const isFeedContext = viewContext === 'feed'

  const maxLength = gtMobile ? 3 : isProfileHeaderContext ? 12 : 6
  const minLength = gtMobile ? 3 : 4

  // Track seen profiles
  const seenProfilesRef = useRef<Set<string>>(new Set())
  const containerRef = useRef<View>(null)
  const hasTrackedRef = useRef(false)
  const logContext: Metrics['suggestedUser:seen']['logContext'] = isFeedContext
    ? 'DiscoverInterstitial'
    : isProfileHeaderContext
      ? 'ProfileHeader'
      : 'ProfileInterstitial'

  // Callback to fire seen events
  const fireSeen = useCallback(() => {
    if (isLoading || error || !profiles.length) return
    if (hasTrackedRef.current) return
    hasTrackedRef.current = true

    const profilesToShow = profiles.slice(0, maxLength)
    profilesToShow.forEach((profile, index) => {
      if (!seenProfilesRef.current.has(profile.actor.did)) {
        seenProfilesRef.current.add(profile.actor.did)
        ax.metric('suggestedUser:seen', {
          logContext,
          recId: profile.recId,
          position: index,
          suggestedDid: profile.actor.did,
          category: null,
        })
      }
    })
  }, [isLoading, error, profiles, maxLength, ax, logContext])

  // For profile header, fire when isVisible becomes true
  useEffect(() => {
    if (isProfileHeaderContext) {
      if (!isVisible) {
        hasTrackedRef.current = false
        return
      }
      fireSeen()
    }
  }, [isVisible, isProfileHeaderContext, fireSeen])

  // For feed interstitials, use IntersectionObserver to detect actual visibility
  useEffect(() => {
    if (isProfileHeaderContext) return // handled above
    if (isLoading || error || !profiles.length) return

    const node = containerRef.current
    if (!node) return

    // Use IntersectionObserver on web to detect when actually visible
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting) {
            fireSeen()
            observer.disconnect()
          }
        },
        {threshold: 0.5},
      )
      // @ts-ignore - web only
      observer.observe(node)
      return () => observer.disconnect()
    } else {
      // On native, delay slightly to account for layout shifts during hydration
      const timeout = setTimeout(() => {
        fireSeen()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isProfileHeaderContext, isLoading, error, profiles.length, fireSeen])

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
            key={profile.actor.did}
            layout={native(
              LinearTransition.delay(DISMISS_ANIMATION_DURATION).easing(
                Easing.out(Easing.exp),
              ),
            )}
            exiting={FadeOut.duration(DISMISS_ANIMATION_DURATION)}
            // for web, as the cards are static, not in a list
            entering={web(FadeIn.delay(DISMISS_ANIMATION_DURATION * 2))}
            style={[
              a.flex_1,
              gtMobile &&
                web([
                  a.flex_0,
                  a.flex_grow,
                  {width: `calc(30% - ${a.gap_md.gap / 2}px)`},
                ]),
            ]}>
            <ProfileCard.Link
              profile={profile.actor}
              onPress={() => {
                ax.metric('suggestedUser:press', {
                  logContext,
                  recId: profile.recId,
                  position: index,
                  suggestedDid: profile.actor.did,
                  category: null,
                })
              }}
              style={[a.flex_1]}>
              {({hovered, pressed}) => (
                <CardOuter
                  style={[
                    (hovered || pressed) && t.atoms.border_contrast_high,
                  ]}>
                  <ProfileCard.Outer>
                    {onDismiss && (
                      <Button
                        label={l`Dismiss this suggestion`}
                        onPress={e => {
                          e.preventDefault()
                          onDismiss(profile.actor.did)
                          ax.metric('suggestedUser:dismiss', {
                            logContext,
                            position: index,
                            suggestedDid: profile.actor.did,
                            recId: profile.recId,
                          })
                        }}
                        style={[
                          a.absolute,
                          a.z_10,
                          a.p_xs,
                          {top: -4, right: -4},
                        ]}>
                        {({
                          hovered: dismissHovered,
                          pressed: dismissPressed,
                        }) => (
                          <X
                            size="xs"
                            fill={
                              dismissHovered || dismissPressed
                                ? t.atoms.text.color
                                : t.atoms.text_contrast_medium.color
                            }
                          />
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
                        profile={profile.actor}
                        moderationOpts={moderationOpts}
                        disabledPreview
                        size={88}
                      />
                      <View style={[a.flex_col, a.align_center, a.max_w_full]}>
                        <ProfileCard.Name
                          profile={profile.actor}
                          moderationOpts={moderationOpts}
                        />
                        <ProfileCard.Description
                          profile={profile.actor}
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
                      profile={profile.actor}
                      moderationOpts={moderationOpts}
                      logContext="FeedInterstitial"
                      withIcon={false}
                      style={[a.rounded_sm]}
                      onFollow={() => {
                        ax.metric('suggestedUser:follow', {
                          logContext,
                          location: 'Profile',
                          recId: profile.recId,
                          position: index,
                          suggestedDid: profile.actor.did,
                          category: null,
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

  useEffect(() => {
    if (error || (!isLoading && profileCountForMinCheck < minLength)) {
      onRequestHide?.()
    }
  }, [error, isLoading, onRequestHide, profileCountForMinCheck, minLength])

  if (error || (!isLoading && profileCountForMinCheck < minLength)) {
    ax.logger.debug(`Not enough profiles to show suggested follows`)
    return null
  }

  return (
    <View
      ref={containerRef}
      style={[
        !isProfileHeaderContext && a.border_t,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}
      pointerEvents={IS_IOS ? 'auto' : 'box-none'}>
      <View
        style={[
          a.px_lg,
          a.pt_md,
          a.flex_row,
          a.align_center,
          a.justify_between,
        ]}
        pointerEvents={IS_IOS ? 'auto' : 'box-none'}>
        <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
          <Trans>Suggested for you</Trans>
        </Text>
        <Button
          label={l`See more suggested profiles`}
          onPress={() => {
            followDialogControl.open()
            ax.metric('suggestedUser:seeMore', {
              logContext,
              recId,
            })
          }}>
          {({hovered}) => (
            <Text
              style={[
                a.text_sm,
                {color: t.palette.primary_500},
                hovered &&
                  web({
                    textDecorationLine: 'underline',
                    textDecorationColor: t.palette.primary_500,
                  }),
              ]}>
              <Trans>See more</Trans>
            </Text>
          )}
        </Button>
      </View>
      <FollowDialogWithoutGuide control={followDialogControl} />
      <LayoutAnimationConfig skipExiting skipEntering>
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

              <SeeMoreSuggestedProfilesCard
                onPress={() => {
                  followDialogControl.open()
                  ax.metric('suggestedUser:seeMore', {
                    logContext,
                  })
                }}
              />
            </ScrollView>
          </BlockDrawerGesture>
        )}
      </LayoutAnimationConfig>
    </View>
  )
}

function SeeMoreSuggestedProfilesCard({onPress}: {onPress: () => void}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={l`Browse more accounts`}
      onPress={onPress}
      style={[
        a.flex_col,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        a.p_md,
        a.rounded_lg,
        {width: FINAL_CARD_WIDTH},
      ]}>
      <ButtonIcon icon={ArrowRight} size="lg" />
      <ButtonText
        style={[a.text_md, a.font_medium, a.leading_snug, a.text_center]}>
        <Trans>See more</Trans>
      </ButtonText>
    </Button>
  )
}

const numFeedsToDisplay = 3
export function SuggestedFeeds() {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {data, isLoading, error} = useGetPopularFeedsQuery({
    limit: numFeedsToDisplay,
  })
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()

  const feeds = useMemo(() => {
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
            ax.metric('feed:interstitial:feedCard:press', {})
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
                    uri={feed.uri}
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
              label={l`Browse more suggestions`}
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
                label={l`Browse more feeds on the Explore page`}
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
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        t.atoms.border_contrast_low,
        a.px_lg,
        a.py_lg,
        !gtMobile && {marginTop: 4},
      ]}>
      <ProgressGuideList />
    </View>
  )
}
