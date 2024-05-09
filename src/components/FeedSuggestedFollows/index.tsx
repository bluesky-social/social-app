import React from 'react'
import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {isJustAMute} from 'lib/moderation'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {useRichText} from '#/components/hooks/useRichText'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function SuggestedFollowCardSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_lg,
        a.rounded_md,
        a.gap_sm,
        t.atoms.bg_contrast_25,
        {
          width: 300,
        },
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <View style={[a.rounded_full, t.atoms.bg, {height: 40, width: 40}]} />

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_lg,
            a.flex_1,
          ]}>
          <View style={[a.gap_xs, a.flex_1]}>
            <View
              style={[a.rounded_xs, t.atoms.bg, {height: 16, width: 200}]}
            />
            <View
              style={[a.rounded_xs, t.atoms.bg, {height: 12, width: 100}]}
            />
          </View>
        </View>
      </View>

      <View style={[a.gap_xs]}>
        <View style={[a.rounded_xs, a.w_full, t.atoms.bg, {height: 12}]} />
        <View style={[a.rounded_xs, a.w_full, t.atoms.bg, {height: 12}]} />
        <View
          style={[a.rounded_xs, a.w_full, t.atoms.bg, {height: 12, width: 100}]}
        />
      </View>
    </View>
  )
}

export function SuggestedFollowCard({
  profile: profileUnshadowed,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}) {
  const t = useTheme()
  const {_} = useLingui()
  const profile = useProfileShadow(profileUnshadowed)
  const moderationOpts = useModerationOpts()
  const {follow, unfollow} = useFollowMethods({
    profile,
    logContext: 'FeedSuggestedFollowCard',
  })
  // @ts-ignore TODO why isn't this type correct
  const [descriptionRT] = useRichText(profileUnshadowed?.description ?? '')

  if (!moderationOpts) return null
  const moderation = moderateProfile(profile, moderationOpts)
  const modui = moderation.ui('profileList')
  if (modui.filter && !isJustAMute(modui)) return null

  return (
    <View
      style={[
        a.p_lg,
        a.rounded_md,
        a.gap_sm,
        t.atoms.bg_contrast_25,
        {
          width: 300,
        },
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <PreviewableUserAvatar
          size={40}
          profile={profile}
          avatar={profile.avatar}
          moderation={moderation.ui('avatar')}
        />

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_lg,
            a.flex_1,
          ]}>
          <View style={[a.gap_2xs, a.flex_1]}>
            <Text
              style={[a.text_md, a.font_bold, a.leading_tight, a.flex_1]}
              numberOfLines={1}>
              {sanitizeDisplayName(
                profile.displayName || sanitizeHandle(profile.handle),
                moderation.ui('displayName'),
              )}
            </Text>
            <Text
              style={[t.atoms.text_contrast_medium, a.flex_1]}
              numberOfLines={1}>
              {sanitizeHandle(profile.handle, '@')}
            </Text>
          </View>

          <Button
            label={
              profile.viewer?.following ? _(msg`Following`) : _(msg`Follow`)
            }
            size="small"
            shape="round"
            variant="solid"
            color="primary"
            onPress={profile.viewer?.following ? unfollow : follow}>
            {profile.viewer?.following ? (
              <ButtonIcon icon={Check} />
            ) : (
              <ButtonIcon icon={Plus} />
            )}
          </Button>
        </View>
      </View>

      <Text numberOfLines={3}>
        <RichText value={descriptionRT} style={[t.atoms.text_contrast_high]} />
      </Text>
    </View>
  )
}

export function ErrorState({retry}: {retry: () => void}) {
  const t = useTheme()
  return (
    <>
      <View
        style={[
          a.align_start,
          a.p_lg,
          a.rounded_md,
          a.gap_md,
          t.atoms.bg_contrast_25,
          {
            width: 300,
          },
        ]}>
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
      </View>

      <SuggestedFollowCardSkeleton />
      <SuggestedFollowCardSkeleton />
    </>
  )
}

export function FeedSuggestedFollowsCards() {
  const {
    isLoading,
    data: suggestions,
    error,
    refetch,
  } = useSuggestedFollowsQuery()

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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => <SuggestedFollowCardSkeleton key={i} />)
        ) : error || !profiles.length ? (
          <ErrorState retry={refetch} />
        ) : (
          profiles.map((profile, i) => (
            <SuggestedFollowCard key={i} profile={profile} />
          ))
        )}
      </View>
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
