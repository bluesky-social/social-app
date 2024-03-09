import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationUI, ModerationCause} from '@atproto/api'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {getModerationCauseKey} from '#/lib/moderation'
import {sanitizeDisplayName} from '#/lib/strings/display-names'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {Text} from '#/components/Typography'
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
    <View style={[a.flex_col, a.gap_xs, a.mb_sm, style]}>
      {modui.inform && (
        <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
          {modui.informs.map(cause => (
            <PostInform key={getModerationCauseKey(cause)} cause={cause} />
          ))}
        </View>
      )}
      {modui.alerts.map(cause => (
        <PostAlert key={getModerationCauseKey(cause)} cause={cause} />
      ))}
    </View>
  )
}

function PostInform({cause}: {cause: ModerationCause}) {
  const control = useModerationDetailsDialogControl()
  const desc = useModerationCauseDescription(cause)

  return (
    <>
      <Button
        label={desc.name}
        variant="solid"
        color="secondary"
        size="tiny"
        shape="default"
        onPress={() => {
          control.open()
        }}>
        <ButtonIcon icon={desc.icon} position="left" />{' '}
        <ButtonText>{desc.name}</ButtonText>
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}

function PostAlert({cause}: {cause: ModerationCause}) {
  const t = useTheme()
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
        }}>
        <ButtonIcon icon={desc.icon} position="left" />
        <ButtonText style={[a.flex_1, a.text_left]}>
          {desc.name}
          {desc.source && (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {' — '}
              {sanitizeDisplayName(desc.source)}
            </Text>
          )}
        </ButtonText>
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}
