import {
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {DEMO_SUPPORTERS} from '../supporters'
import {SupportersDialog} from './SupportersDialog'

const AVI_BORDER = 1
const MAX_FACES = 3

/**
 * PROTOTYPE STAND-IN. Bluesky never sees the payment, so there is no real
 * list of supporters yet. Version B reads the creator's known followers - the
 * people you follow who also follow them - and presents them as supporters,
 * so the design can be judged with real faces from your own network. Falls
 * back to the shared DEMO_SUPPORTERS list for test accounts with no network
 * overlap. Replace this hook when a real source exists; the row doesn't care.
 */
function useSupporters(
  creator: bsky.profile.AnyProfileView | undefined,
): {profiles: bsky.profile.AnyProfileView[]; count: number} | null {
  const {data} = useProfileQuery({did: creator?.did})
  const demo = creator ? DEMO_SUPPORTERS[creator.handle] : undefined
  const {data: demoData} = useProfilesQuery({handles: demo?.handles ?? []})

  const known = data?.viewer?.knownFollowers
  if (known && known.followers.length > 0) {
    return {profiles: known.followers, count: known.count}
  }
  if (demo && demoData?.profiles.length) {
    return {profiles: demoData.profiles, count: demo.count}
  }
  return null
}

/**
 * Social proof for the Support button: stacked avatars plus "Supported by A,
 * B, and N others", modeled on the profile's "Followed by" row so it reads as
 * the same kind of fact. Renders nothing when no one you follow supports the
 * creator - an empty state would only undercut the button. When `interactive`,
 * tapping the row opens the full supporter list.
 */
export function SupportedBy({
  creator,
  size = 'regular',
  interactive = false,
  style,
}: {
  creator?: bsky.profile.AnyProfileView
  /** `compact` fits inside the post card; `regular` matches the profile row. */
  size?: 'compact' | 'regular'
  /** Make the row tappable, opening the full supporter list. */
  interactive?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = useDialogControl()
  const supporters = useSupporters(creator)
  if (!supporters || !moderationOpts) return null

  const compact = size === 'compact'
  const aviSize = compact ? 26 : 30
  const textStyle = [
    compact ? a.text_sm : a.text_md,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]

  const faces = supporters.profiles.slice(0, MAX_FACES).map(f => {
    const moderation = moderateProfile(f, moderationOpts)
    return {
      did: f.did,
      avatar: f.avatar,
      isLabeler: !!f.associated?.labeler,
      name: sanitizeDisplayName(
        f.displayName || f.handle,
        moderation.ui('displayName'),
      ),
      moderation,
    }
  })
  // the server count includes people moderation hid, so never show fewer
  const count = Math.max(supporters.count, faces.length)

  const row = (
    <View
      style={[
        a.flex_row,
        a.align_center,
        compact ? a.gap_sm : a.gap_md,
        {marginLeft: -AVI_BORDER},
        style,
      ]}>
      <View style={[a.flex_row, {height: aviSize}]}>
        {faces.map((face, i) => (
          <View
            key={face.did}
            style={[
              a.rounded_full,
              {
                borderWidth: AVI_BORDER,
                borderColor: t.atoms.bg.backgroundColor,
                width: aviSize + AVI_BORDER * 2,
                height: aviSize + AVI_BORDER * 2,
                zIndex: faces.length - i,
                marginLeft: i > 0 ? -Math.round(aviSize / 3) : 0,
              },
            ]}>
            <UserAvatar
              size={aviSize}
              avatar={face.avatar}
              moderation={face.moderation.ui('avatar')}
              type={face.isLabeler ? 'labeler' : 'user'}
              noBorder
            />
          </View>
        ))}
      </View>
      <Text style={[a.flex_1, textStyle]} numberOfLines={2}>
        <SupportedByText
          names={faces.map(f => f.name)}
          count={count}
          textStyle={textStyle}
        />
      </Text>
    </View>
  )

  if (!interactive) return row

  return (
    <>
      <Button
        label={l`See everyone who supports this creator`}
        onPress={() => control.open()}
        style={[a.w_full, a.justify_start]}>
        {row}
      </Button>
      <SupportersDialog
        control={control}
        profiles={supporters.profiles}
        count={count}
      />
    </>
  )
}

/**
 * The four phrasings, mirroring `KnownFollowers`: the names we can show, then
 * however many more the server counted.
 */
function SupportedByText({
  names,
  count,
  textStyle,
}: {
  names: string[]
  count: number
  textStyle: StyleProp<TextStyle>
}) {
  const [first, second] = names

  if (second) {
    return count > 2 ? (
      <Trans context="Creator support social proof">
        Supported by{' '}
        <Text emoji key="first" style={textStyle}>
          {first}
        </Text>
        ,{' '}
        <Text emoji key="second" style={textStyle}>
          {second}
        </Text>
        , and <Plural value={count - 2} one="# other" other="# others" />
      </Trans>
    ) : (
      <Trans context="Creator support social proof">
        Supported by{' '}
        <Text emoji key="first" style={textStyle}>
          {first}
        </Text>{' '}
        and{' '}
        <Text emoji key="second" style={textStyle}>
          {second}
        </Text>
      </Trans>
    )
  }

  return count > 1 ? (
    <Trans context="Creator support social proof">
      Supported by{' '}
      <Text emoji key="first" style={textStyle}>
        {first}
      </Text>{' '}
      and <Plural value={count - 1} one="# other" other="# others" />
    </Trans>
  ) : (
    <Trans context="Creator support social proof">
      Supported by{' '}
      <Text emoji key="first" style={textStyle}>
        {first}
      </Text>
    </Trans>
  )
}
