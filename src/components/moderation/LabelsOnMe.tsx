import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {
  Button,
  ButtonIcon,
  type ButtonSize,
  ButtonText,
} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  LabelsOnMeDialog,
  useLabelsOnMeDialogControl,
} from '#/components/moderation/LabelsOnMeDialog'

export function LabelsOnMe({
  labels,
  size,
  style,
}: {
  labels: ComAtprotoLabelDefs.Label[] | undefined
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const control = useLabelsOnMeDialogControl()

  if (!labels || !currentAccount) {
    return null
  }
  labels = labels.filter(
    l =>
      !l.val.startsWith('!') &&
      !(l.val === 'bot' && l.src === currentAccount.did),
  )
  if (!labels.length) {
    return null
  }

  return (
    <View style={[a.flex_row, style]}>
      <LabelsOnMeDialog control={control} labels={labels} type="account" />

      <Button
        variant="solid"
        color="secondary"
        size={size || 'small'}
        label={_(msg`View information about these labels`)}
        onPress={() => {
          control.open()
        }}>
        <ButtonIcon position="left" icon={CircleInfo} />
        <ButtonText style={[a.leading_snug]}>
          <Plural
            value={labels.length}
            one="# account label"
            other="# account labels"
          />
        </ButtonText>
      </Button>
    </View>
  )
}
