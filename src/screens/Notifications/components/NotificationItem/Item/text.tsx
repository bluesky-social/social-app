import {type StyleProp, type TextStyle} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {type I18n} from '@lingui/core'
import {defineMessage} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {dateDiff, formatDateDiff} from '#/lib/hooks/useTimeAgo'
import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme, web} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

/**
 * The headline sentence of a row, e.g. "**alice** and **3 others** liked
 * your post". Compose it from `Item.Name` and `Item.Strong` inside a
 * `<Trans>`, so that translators get the whole sentence.
 */
export function PrimaryText({
  style,
  children,
}: {
  style?: StyleProp<TextStyle>
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <Text emoji style={[a.text_sm, a.leading_snug, t.atoms.text, style]}>
      {children}
    </Text>
  )
}

/**
 * Muted supporting text, e.g. a preview of the post that was liked.
 */
export function SecondaryText({
  numberOfLines,
  style,
  children,
}: {
  numberOfLines?: number
  style?: StyleProp<TextStyle>
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <Text
      emoji
      numberOfLines={numberOfLines}
      style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium, style]}>
      {children}
    </Text>
  )
}

/**
 * Emphasised inline text within `Item.PrimaryText`, e.g. "**3 others**".
 */
export function Strong({children}: {children: React.ReactNode}) {
  return (
    <Text emoji style={[a.text_sm, a.leading_snug, a.font_semi_bold]}>
      {children}
    </Text>
  )
}

/**
 * Display name for a profile, respecting moderation, and falling back to the
 * handle if the name is empty or hidden.
 */
export function useDisplayName(profile: bsky.profile.AnyProfileView) {
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined
  return (
    sanitizeDisplayName(
      profile.displayName || '',
      moderation?.ui('displayName'),
    ) || sanitizeHandle(profile.handle)
  )
}

/**
 * A profile's name inside `Item.PrimaryText`. Links to their profile and
 * shows a hover card on web.
 */
export function Name({profile}: {profile: bsky.profile.AnyProfileView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const name = useDisplayName(profile)

  return (
    <ProfileHoverCard did={profile.did} inline>
      <InlineLinkText
        to={makeProfileLink(profile)}
        label={l`Go to ${name}’s profile`}
        disableMismatchWarning
        disableUnderline
        emoji
        style={[
          a.text_sm,
          a.leading_snug,
          a.font_semi_bold,
          t.atoms.text,
          web({direction: 'ltr', unicodeBidi: 'isolate'}),
        ]}>
        {forceLTR(name)}
        <ProfileBadges
          profile={profile}
          size="sm"
          style={[a.px_2xs, {transform: [{translateY: 1}]}]}
        />
      </InlineLinkText>
    </ProfileHoverCard>
  )
}

/**
 * Relative time a notification happened, e.g. "7m ago". Shows the full date
 * on hover on web.
 */
export function Timestamp({date}: {date: string}) {
  const t = useTheme()
  const {i18n} = useLingui()

  return (
    <TimeElapsed timestamp={date} timeToString={formatTimeAgo}>
      {({timeElapsed}) => (
        <Text
          title={niceDate(i18n, date)}
          style={[a.text_xs, t.atoms.text_contrast_low]}>
          {timeElapsed}
        </Text>
      )}
    </TimeElapsed>
  )
}

function formatTimeAgo(i18n: I18n, timestamp: string) {
  const diff = dateDiff(timestamp, Date.now())
  const formatted = formatDateDiff({diff, i18n})

  // "now", and dates over a year old, read fine on their own
  if (diff.unit === 'now' || (diff.unit === 'month' && diff.value >= 12)) {
    return formatted
  }

  return i18n._(
    defineMessage({
      message: `${formatted} ago`,
      comment:
        'How long ago a notification happened, e.g. "7m ago". The time is already abbreviated and translated.',
    }),
  )
}
