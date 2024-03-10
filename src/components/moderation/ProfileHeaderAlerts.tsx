import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationCause, ModerationDecision} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {getModerationCauseKey} from 'lib/moderation'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {Text} from '#/components/Typography'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'

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
      {modui.inform && (
        <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
          {modui.informs.map(cause => (
            <ProfileInform key={getModerationCauseKey(cause)} cause={cause} />
          ))}
        </View>
      )}
      {modui.alerts.map(cause => (
        <ProfileAlert key={getModerationCauseKey(cause)} cause={cause} />
      ))}
    </View>
  )
}

function ProfileInform({cause}: {cause: ModerationCause}) {
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
        <ButtonIcon icon={desc.icon} position="left" />
        <ButtonText>{desc.name}</ButtonText>
      </Button>

      <ModerationDetailsDialog control={control} modcause={cause} />
    </>
  )
}

function ProfileAlert({cause}: {cause: ModerationCause}) {
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
        <ButtonText style={[a.flex_1, a.text_left, a.italic, a.leading_snug]}>
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
