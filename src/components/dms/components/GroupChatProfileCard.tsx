import {View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import {canBeMessaged} from '#/components/dms/util'
import * as Toggle from '#/components/forms/Toggle'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function GroupChatProfileCard({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const enabled = canBeMessaged(profile)
  const moderation = moderateProfile(profile, moderationOpts)
  const handle = sanitizeHandle(profile.handle, '@')
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  return (
    <Toggle.Item
      key={profile.did}
      disabled={!enabled}
      name={profile.did}
      label={displayName}
      style={[a.flex_1, a.py_sm, a.px_lg]}>
      <View style={[a.flex_grow, !enabled ? {opacity: 0.5} : null]}>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            size={44}
            disabledPreview
          />
          <View>
            <ProfileCard.Name
              profile={profile}
              moderationOpts={moderationOpts}
            />
            {enabled ? (
              <ProfileCard.Handle profile={profile} />
            ) : (
              <Text
                style={[a.leading_snug, t.atoms.text_contrast_high]}
                numberOfLines={2}>
                <Trans>{handle} can’t be messaged</Trans>
              </Text>
            )}
          </View>
        </ProfileCard.Header>
      </View>
      {enabled ? <Toggle.Checkbox /> : null}
    </Toggle.Item>
  )
}
