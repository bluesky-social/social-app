import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export const ConfirmLanguagesButton = ({
  onPress,
  extraText,
}: {
  onPress: () => void
  extraText?: string
}) => {
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const t = useTheme()

  return (
    <View
      style={[
        a.pt_lg,
        a.px_lg,
        t.atoms.border_contrast_low,
        isMobile && [a.pb_2xl, a.border_t],
      ]}>
      <Button
        testID="confirmContentLanguagesBtn"
        onPress={onPress}
        color="primary"
        size="large"
        label={_(msg`Confirm content language settings`)}
        style={[a.w_full]}>
        <ButtonText>
          <Trans>Done{extraText}</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
