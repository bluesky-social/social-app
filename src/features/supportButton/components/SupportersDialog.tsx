import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

/**
 * The full list of people who support a creator, opened from the supporter
 * stack under the Support button. Reuses the app's ProfileCard so each row
 * looks and behaves like a profile anywhere else (tap to open, follow inline).
 */
export function SupportersDialog({
  control,
  profiles,
  count,
}: {
  control: Dialog.DialogControlProps
  profiles: bsky.profile.AnyProfileView[]
  count: number
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Supporters`}>
        <View style={[a.gap_sm, a.pb_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.leading_tight]}>
            <Trans>Supporters</Trans>
          </Text>
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Plural
              value={count}
              one="# person supports this creator"
              other="# people support this creator"
            />
          </Text>
        </View>
        <Divider />
        <View style={[a.gap_md, a.pt_md]}>
          {moderationOpts &&
            profiles.map((profile, i) => (
              <ProfileCard.Default
                key={profile.did}
                profile={profile}
                moderationOpts={moderationOpts}
                position={i}
                onPress={() => control.close()}
              />
            ))}
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
