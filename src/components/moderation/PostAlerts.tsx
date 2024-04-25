import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey, isAppLabeler} from '#/lib/moderation'
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
  const alerts = modui.alerts.filter(shouldShow)
  const informs = modui.informs.filter(shouldShow)
  if (!alerts.length && !informs.length) {
    return null
  }

  return (
    <View style={[a.flex_col, a.gap_xs, style]}>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        {alerts.map(cause => (
          <PostLabel key={getModerationCauseKey(cause)} cause={cause} />
        ))}
        {informs.map(cause => (
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

function shouldShow(cause: ModerationCause): boolean {
  if (cause.type === 'label') {
    // NOTE
    //
    // The issue we have with labels on accounts is that 'negative' labels are showing
    // everywhere, acting as a kind of "scarlet letter" punishment, when their intent
    // is to just enable users to hide other users that are causing issues. Labelers
    // don't have a way to express that an account-level label shouldnt show on every
    // post.
    //
    // However, there are some cases where we really do want to show the labels:
    //
    // 1. When the label is informational or positive (like "Verified")
    // 2. When the label is crucial (like "Impersonation")
    //
    // The solution we're applying FOR NOW is to hide severity=alert labels on accounts
    // when looking at posts unless they're from the app's baked in moderation.
    //
    // The labeling system will need to be expanded to improve this situation. See
    // https://github.com/bluesky-social/atproto/issues/2444
    //
    // -prf
    if (cause.labelDef.severity === 'alert' && cause.target !== 'content') {
      return cause.source.type === 'labeler' && isAppLabeler(cause.source.did)
    }
  }
  return true
}
