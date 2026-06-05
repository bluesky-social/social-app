import {View} from 'react-native'
import {Plural, Trans} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useChatInvite} from './Context'

/**
 * Presentational preview of a chat invite: member avatars, group name, member
 * count, and owner. Reads the preview from `ChatInvite.Root` context. Renders
 * nothing if there's no preview (use a fallback alongside it for that case).
 */
export function Card({size}: {size: 'large' | 'small'}) {
  const t = useTheme()
  const {preview, hasFixedHeight} = useChatInvite()

  if (!preview) return null

  const ownerDisplayName = createSanitizedDisplayName(preview.owner)
  const ownerHandle = sanitizeHandle(preview.owner.handle, '@')
  const avatarProfiles = preview.convo?.members ?? [preview.owner]

  return (
    <View style={[a.flex_row, a.gap_md, a.align_center]}>
      <AvatarBubbles size={56} self profiles={avatarProfiles} />
      <View style={[a.flex_1, size === 'large' ? a.gap_2xs : a.gap_xs]}>
        <Text
          emoji
          style={[size === 'large' ? a.text_lg : a.text_md, a.font_bold]}
          numberOfLines={1}
          allowFontScaling={!hasFixedHeight}>
          {preview.name}
        </Text>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Text
            style={[a.text_2xs, a.font_medium, t.atoms.text_contrast_high]}
            numberOfLines={1}
            allowFontScaling={!hasFixedHeight}>
            <Trans>Group chat</Trans>
          </Text>
          <Text
            style={[
              a.text_2xs,
              a.leading_tight,
              a.font_medium,
              t.atoms.text_contrast_high,
            ]}
            numberOfLines={1}
            allowFontScaling={!hasFixedHeight}>
            <Trans comment="The number of members in a group chat, in the format '{members}/{total} members'.">
              {preview.memberCount}/{preview.memberLimit}{' '}
              <Plural
                value={preview.memberCount}
                one="member"
                other="members"
              />
            </Trans>
          </Text>
        </View>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.gap_xs,
            size === 'large' && a.mt_2xs,
          ]}>
          <Text
            emoji
            style={[a.flex_shrink, a.text_sm, a.font_medium]}
            numberOfLines={1}
            allowFontScaling={!hasFixedHeight}>
            <Trans comment="The group chat creator, in the format 'By {displayName}'.">
              By{' '}
              <Text style={[a.font_medium]} allowFontScaling={!hasFixedHeight}>
                {ownerDisplayName}
              </Text>
            </Trans>
          </Text>
          <ProfileBadges
            profile={preview.owner}
            size="sm"
            allowFontScaling={!hasFixedHeight}
          />
          <Text
            style={[a.flex_shrink, t.atoms.text_contrast_medium]}
            numberOfLines={1}
            allowFontScaling={!hasFixedHeight}>
            {ownerHandle}
          </Text>
        </View>
      </View>
    </View>
  )
}
