import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {isPeerModDid} from '#/state/queries/peer-mod-permissions'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PeerModerator_Stroke2_Corner0_Rounded as PeerModIcon} from '#/components/icons/PeerModerator'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function PeerModBadge({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  if (!isPeerModDid(profile.did)) return null
  return (
    <View>
      <PeerModIcon width={width} fill={t.palette.primary_500} />
    </View>
  )
}

export function PeerModBadgeButton({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  if (!isPeerModDid(profile.did)) return null
  return (
    <>
      <Button
        label={_(msg`Blacksky peer moderator`)}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          control.open()
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_center,
              a.align_center,
              a.transition_transform,
              {
                width,
                height: width,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <PeerModIcon width={width} fill={t.palette.primary_500} />
          </View>
        )}
      </Button>
      <PeerModeratorDialog control={control} />
    </>
  )
}

function PeerModeratorDialog({control}: {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label="Peer moderator">
        <View style={[a.gap_md]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <PeerModIcon width={28} fill={t.palette.primary_500} />
            <Text style={[a.text_xl, a.font_bold]}>
              <Trans>Blacksky Peer Moderator</Trans>
            </Text>
          </View>
          <Text style={[t.atoms.text_contrast_high, a.text_md, a.leading_snug]}>
            <Trans>
              This account is a Blacksky community peer moderator. Peer
              moderators help keep the community safe by applying labels and
              reviewing reports alongside the core Blacksky team.
            </Trans>
          </Text>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
