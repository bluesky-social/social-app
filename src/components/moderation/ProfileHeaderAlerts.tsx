import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {
  BSKY_LABELER_DID,
  ModerationCause,
  ModerationDecision,
} from '@atproto/api'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {getModerationCauseKey} from 'lib/moderation'
import {UserAvatar} from '#/view/com/util/UserAvatar'
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

export function ProfileLabel({
  cause,
  disableDetailsDialog,
}: {
  cause: ModerationCause
  disableDetailsDialog?: boolean
}) {
  const t = useTheme()
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)

  return (
    <>
      <Button
        disabled={disableDetailsDialog}
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
            {desc.sourceType === 'labeler' &&
            desc.sourceDid !== BSKY_LABELER_DID ? (
              <UserAvatar avatar={desc.sourceAvi} size={16} />
            ) : (
              <desc.icon size="sm" fill={t.atoms.text_contrast_medium.color} />
            )}
            <Text
              style={[
                a.text_left,
                a.leading_snug,
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.font_semibold,
              ]}>
              {desc.name}
            </Text>
          </View>
        )}
      </Button>

      {!disableDetailsDialog && (
        <ModerationDetailsDialog control={control} modcause={cause} />
      )}
    </>
  )
}
