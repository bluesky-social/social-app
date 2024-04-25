import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationCause, ModerationDecision} from '@atproto/api'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {getModerationCauseKey} from 'lib/moderation'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export function ProfileHeaderAlerts({
  moderation,
  style,
}: {
  moderation: ModerationDecision
  style?: StyleProp<ViewStyle>
}) {
  const modui = moderation.ui('profileView')
  if (!modui.alert && !modui.inform) {
    return null
  }

  return (
    <View style={[a.flex_col, a.gap_xs, style]}>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        {modui.alerts.map(cause => (
          <ProfileLabel key={getModerationCauseKey(cause)} cause={cause} />
        ))}
        {modui.informs.map(cause => (
          <ProfileLabel key={getModerationCauseKey(cause)} cause={cause} />
        ))}
      </View>
    </View>
  )
}

function ProfileLabel({cause}: {cause: ModerationCause}) {
  const t = useTheme()
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)

  return (
    <>
      <Button
        label={desc.name}
        onPress={() => {
          control.open()
        }}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              {paddingLeft: 6, paddingRight: 8, paddingVertical: 4},
              a.gap_xs,
              a.rounded_md,
              hovered || pressed
                ? t.atoms.bg_contrast_50
                : t.atoms.bg_contrast_25,
            ]}>
            <desc.icon size="sm" fill={t.atoms.text_contrast_medium.color} />
            <Text
              style={[
                a.text_left,
                a.leading_snug,
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.font_semibold,
              ]}>
              {desc.name}
              {desc.source ? ` – ${desc.source}` : ''}
            </Text>
          </View>
        )}
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}
