import {StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, tokens} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export const ConfirmLanguagesButton = ({
  onPress,
  extraText,
}: {
  onPress: () => void
  extraText?: string
}) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  return (
    <View
      style={[
        styles.btnContainer,
        pal.borderDark,
        isMobile && {
          paddingBottom: 40,
          borderTopWidth: 1,
        },
      ]}>
      <Button
        testID="confirmContentLanguagesBtn"
        onPress={onPress}
        color="primary"
        size="large"
        variant="solid"
        label={_(msg`Confirm content language settings`)}
        style={[a.w_full]}>
        <ButtonText>
          <Trans>Done{extraText}</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  btnContainer: {
    paddingTop: tokens.space.lg,
    paddingHorizontal: tokens.space.lg,
  },
})
