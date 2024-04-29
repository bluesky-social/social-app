import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export function PostAlerts({
  modui,
  style,
}: {
  modui: ModerationUI
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
}) {
  if (!modui.alert && !modui.inform) {
    return null
  }

  return (
    <View style={[a.flex_col, a.gap_xs, style]}>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        {modui.alerts.map(cause => (
          <PostLabel key={getModerationCauseKey(cause)} cause={cause} />
        ))}
        {modui.informs.map(cause => (
          <PostLabel key={getModerationCauseKey(cause)} cause={cause} />
        ))}
      </View>
    </View>
  )
}

function PostLabel({cause}: {cause: ModerationCause}) {
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)
  const t = useTheme()

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
              {paddingLeft: 4, paddingRight: 6, paddingVertical: 1},
              a.gap_xs,
              a.rounded_sm,
              hovered || pressed
                ? t.atoms.bg_contrast_50
                : t.atoms.bg_contrast_25,
            ]}>
            <desc.icon size="xs" fill={t.atoms.text_contrast_medium.color} />
            <Text
              style={[
                a.text_left,
                a.leading_snug,
                a.text_xs,
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
