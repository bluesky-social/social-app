import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {ModerationUI, ModerationCause} from '@atproto/api'
import {Text} from '../text/Text'
import {Trans} from '@lingui/macro'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {getModerationCauseKey} from '#/lib/moderation'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {ModerationDetailsDialog} from '#/components/dialogs/ModerationDetails'
import {useOpenGlobalDialog} from '#/components/dialogs'

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
  const openDialog = useOpenGlobalDialog()
  const desc = useModerationCauseDescription(cause, 'content')

  return (
    <Button
      label={desc.name}
      variant="solid"
      color="secondary"
      size="tiny"
      shape="default"
      onPress={() => {
        openDialog(ModerationDetailsDialog, {
          context: 'content',
          modcause: cause,
        })
      }}>
      <ButtonIcon
        icon={cause.type === 'muted' ? EyeSlash : CircleInfo}
        position="left"
      />{' '}
      <ButtonText>{desc.name}</ButtonText>
    </Button>
  )
}

function PostAlert({cause}: {cause: ModerationCause}) {
  const t = useTheme()
  const openDialog = useOpenGlobalDialog()
  const desc = useModerationCauseDescription(cause, 'content')

  return (
    <Button
      label={desc.name}
      variant="solid"
      color="secondary"
      size="small"
      shape="default"
      onPress={() => {
        openDialog(ModerationDetailsDialog, {
          context: 'content',
          modcause: cause,
        })
      }}>
      <ButtonIcon icon={Shield} position="left" />
      <ButtonText style={[a.flex_1, a.text_left]}>
        {desc.name}
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {' — ' /* TODO get actual labeler */}
          <Trans>Bluesky Safety</Trans>
        </Text>
      </ButtonText>
    </Button>
  )
}
