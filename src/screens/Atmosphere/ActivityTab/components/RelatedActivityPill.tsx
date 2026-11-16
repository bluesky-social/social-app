import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {ArrowPathUp_Stroke2_Corner1_Rounded as RecommendIcon} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
import {type RelatedActivity} from '../rows'

const MAX_AVATARS = 3

/** "Recommended by <first actor> +N" below an article's card. */
export function RelatedActivityPill({related}: {related: RelatedActivity}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const [first] = related.actors
  const others = related.actorCount - 1
  const moderation = moderationOpts
    ? moderateProfile(first, moderationOpts)
    : undefined
  const name = sanitizeDisplayName(
    first.displayName || sanitizeHandle(first.handle),
    moderation?.ui('displayName'),
  )
  const strong = [a.text_xs, a.font_semi_bold, t.atoms.text]

  return (
    <View
      testID="activityRelatedPill"
      style={[
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.px_md,
        a.py_sm,
        a.rounded_full,
        t.atoms.bg_contrast_25,
      ]}>
      <RecommendIcon size="sm" fill={t.palette.primary_500} />
      <AvatarStack
        profiles={related.actors.slice(0, MAX_AVATARS)}
        size={20}
        backgroundColor={t.atoms.bg_contrast_25.backgroundColor}
      />
      <Text
        emoji
        numberOfLines={1}
        style={[a.flex_1, a.text_xs, a.leading_snug, t.atoms.text]}>
        {others > 0 ? (
          <Trans>
            Recommended by{' '}
            <Text emoji style={strong}>
              {name}
            </Text>{' '}
            +{others}
          </Trans>
        ) : (
          <Trans>
            Recommended by{' '}
            <Text emoji style={strong}>
              {name}
            </Text>
          </Trans>
        )}
      </Text>
    </View>
  )
}
