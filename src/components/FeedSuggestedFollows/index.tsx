import React from 'react'
import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {atoms as a, useBreakpoints, useTheme, ViewStyleProp} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        !gtMobile && {
          width: 300,
        },
        {
          borderColor: t.atoms.bg_contrast_25.backgroundColor,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowCardSkeleton() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.AvatarPlaceholder />
        <ProfileCard.NameAndHandlePlaceholder />
      </ProfileCard.Header>

      <ProfileCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

export function ErrorState({retry}: {retry: () => void}) {
  const t = useTheme()
  return (
    <>
      <CardOuter>
        <CircleInfo size="lg" fill={t.palette.negative_400} />
        <Text style={[a.font_bold]}>Whoops, something went wrong :(</Text>
        <Button
          label={'Retry'}
          size="small"
          variant="ghost"
          color="secondary"
          onPress={retry}>
          <ButtonText>Retry</ButtonText>
          <ButtonIcon icon={Refresh} position="right" />
        </Button>
      </CardOuter>

      <SuggestedFollowCardSkeleton />
      <SuggestedFollowCardSkeleton />
    </>
  )
}

export function FeedSuggestedFollowsCards() {
  const t = useTheme()
  const {_} = useLingui()
  const {
    isLoading: isSuggestionsLoading,
    data: suggestions,
    error,
    refetch,
  } = useSuggestedFollowsQuery({limit: 6})
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()
  const isLoading = isSuggestionsLoading || !moderationOpts
  const maxLength = gtMobile ? 3 : 6

  const profiles: AppBskyActorDefs.ProfileViewBasic[] = []
  if (suggestions) {
    // Currently the responses contain duplicate items.
    // Needs to be fixed on backend, but let's dedupe to be safe.
    let seen = new Set()
    for (const page of suggestions.pages) {
      for (const actor of page.actors) {
        if (!seen.has(actor.did)) {
          seen.add(actor.did)
          profiles.push(actor)
        }
      }
    }
  }

  const content = isLoading ? (
    Array(3)
      .fill(0)
      .map((_, i) => <SuggestedFollowCardSkeleton key={i} />)
  ) : error || !profiles.length ? (
    <ErrorState retry={refetch} />
  ) : (
    <>
      {profiles.slice(0, maxLength).map(profile => (
        <ProfileCard.Link key={profile.did} did={profile.handle}>
          <CardOuter style={[a.flex_1]}>
            <ProfileCard.Outer>
              <ProfileCard.Header>
                <ProfileCard.Avatar
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.FollowButton
                  profile={profile}
                  logContext="FeedSuggestedFollowsCard"
                  shape={gtMobile ? undefined : 'round'}
                  variant="outline"
                />
              </ProfileCard.Header>
              <ProfileCard.Description profile={profile} />
            </ProfileCard.Outer>
          </CardOuter>
        </ProfileCard.Link>
      ))}
    </>
  )

  return gtMobile ? (
    <View style={[a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md]}>
      {content}
    </View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
        {content}
      </View>

      <Button
        label={_(msg`Browse more accounts on our explore page`)}
        onPress={() => {
          navigation.navigate('SearchTab')
        }}>
        <CardOuter style={[a.flex_1, t.atoms.bg_contrast_25, {borderWidth: 0}]}>
          <View style={[a.flex_1, a.justify_center]}>
            <View style={[a.flex_row, a.px_lg]}>
              <Text style={[a.pr_xl, a.flex_1, a.leading_snug]}>
                <Trans>Browse more suggestions on our explore page</Trans>
              </Text>

              <Arrow size="xl" />
            </View>
          </View>
        </CardOuter>
      </Button>
    </ScrollView>
  )
}

export function FeedSuggestedFollowsInterstitial() {
  const t = useTheme()

  return (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View style={[a.pt_xl, a.px_lg, a.flex_row, a.gap_md]}>
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          Suggested for you
        </Text>
      </View>

      <FeedSuggestedFollowsCards />
    </View>
  )
}
