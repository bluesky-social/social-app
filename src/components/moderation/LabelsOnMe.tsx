import {type StyleProp, View, type ViewStyle} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural} from '@lingui/react/macro'

import {filterUserFacingLabels} from '#/lib/moderation'
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
import {type com} from '#/lexicons'

export function LabelsOnMe({
  labels,
  size,
  style,
}: {
  labels: com.atproto.label.defs.Label[] | undefined
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const control = useLabelsOnMeDialogControl()

  if (!labels || !currentAccount) {
    return null
  }
  labels = filterUserFacingLabels(labels, currentAccount.did)
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
