import {useCallback} from 'react'
import {LayoutAnimation} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export function ShowMore({onPress: onPressProp}: {onPress: () => void}) {
  const {_} = useLingui()

  const onPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onPressProp()
  }, [onPressProp])

  return (
    <Button
      label={_(msg`Expand post text`)}
      onPress={onPress}
      color="primary"
      variant="ghost"
      style={[a.self_start, a.my_xs, a.rounded_2xs]}
      hitSlop={HITSLOP_10}>
      <ButtonText>
        <Trans>Show More</Trans>
      </ButtonText>
    </Button>
  )
}
