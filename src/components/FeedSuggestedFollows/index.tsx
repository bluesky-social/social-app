import React from 'react'
import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/queries/preferences'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {isJustAMute} from 'lib/moderation'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {useRichText} from '#/components/hooks/useRichText'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

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
    // @ts-ignore TODO
    logContext: 'FeedSuggestedFollowsCard',
  })
  // @ts-ignore TODO
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
        t.atoms.bg,
        {
          width: 300,
        },
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <PreviewableUserAvatar
          size={40}
          did={profile.did}
          handle={profile.handle}
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
            color="secondary"
            onPress={profile.viewer?.following ? unfollow : follow}>
            {profile.viewer?.following ? (
              <ButtonIcon icon={Check} />
            ) : (
              <ButtonIcon icon={Plus} />
            )}
          </Button>
        </View>
      </View>

      <Text style={[a.flex_1]} numberOfLines={2}>
        <RichText value={descriptionRT} style={[t.atoms.text_contrast_high]} />
      </Text>
    </View>
  )
}

export function FeedSuggestedFollows() {
  const t = useTheme()
  const {isLoading, data: suggestions, error} = useSuggestedFollowsQuery()

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
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View style={[a.pt_xl, a.px_lg, a.flex_row, a.gap_md]}>
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          Suggested for you
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
          {isLoading
            ? null
            : error || !profiles.length
            ? null
            : profiles.map((profile, i) => (
                <SuggestedFollowCard key={i} profile={profile} />
              ))}
        </View>
      </ScrollView>
    </View>
  )
}
