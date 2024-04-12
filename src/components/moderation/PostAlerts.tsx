import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'

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

  return (
    <>
      <Button
        label={desc.name}
        variant="solid"
        color="secondary"
        size="small"
        shape="default"
        onPress={() => {
          control.open()
        }}
        style={[a.px_sm, a.py_xs, a.gap_xs]}>
        <ButtonIcon icon={desc.icon} position="left" />
        <ButtonText style={[a.text_left, a.leading_snug]}>
          {desc.name}
        </ButtonText>
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}
