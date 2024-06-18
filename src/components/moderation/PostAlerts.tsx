import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {BSKY_LABELER_DID, ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export function PostAlerts({
  modui,
  size,
  style,
}: {
  modui: ModerationUI
  size?: 'medium' | 'large'
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
          <PostLabel
            key={getModerationCauseKey(cause)}
            cause={cause}
            size={size}
          />
        ))}
        {modui.informs.map(cause => (
          <PostLabel
            key={getModerationCauseKey(cause)}
            cause={cause}
            size={size}
          />
        ))}
      </View>
    </View>
  )
}

function PostLabel({
  cause,
  size,
}: {
  cause: ModerationCause
  size?: 'medium' | 'large'
}) {
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)
  const t = useTheme()

  return (
    <>
      <Button
        label={desc.name}
        onPress={e => {
          e.preventDefault()
          e.stopPropagation()
          control.open()
        }}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_xs,
              a.rounded_sm,
              hovered || pressed
                ? size === 'large'
                  ? t.atoms.bg_contrast_50
                  : t.atoms.bg_contrast_25
                : size === 'large'
                ? t.atoms.bg_contrast_25
                : undefined,
              size === 'large'
                ? {paddingLeft: 4, paddingRight: 6, paddingVertical: 2}
                : {paddingRight: 4, paddingVertical: 1},
            ]}>
            {desc.sourceType === 'labeler' &&
            desc.sourceDid !== BSKY_LABELER_DID ? (
              <UserAvatar
                avatar={desc.sourceAvi}
                size={size === 'large' ? 16 : 12}
                type="labeler"
                shape="circle"
              />
            ) : (
              <desc.icon size="sm" fill={t.atoms.text_contrast_medium.color} />
            )}
            <Text
              style={[
                a.text_left,
                a.leading_snug,
                size === 'large' ? {fontSize: 13} : a.text_xs,
                size === 'large' ? t.atoms.text : t.atoms.text_contrast_high,
              ]}>
              {desc.name}
            </Text>
          </View>
        )}
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}
