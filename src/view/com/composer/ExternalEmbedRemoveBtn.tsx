import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export function ExternalEmbedRemoveBtn({onRemove}: {onRemove: () => void}) {
  const {_} = useLingui()

  return (
    <View style={[a.absolute, {top: 8, right: 8}, a.z_50]}>
      <Button
        label={_(msg`Remove attachment`)}
        onPress={onRemove}
        size="small"
        variant="solid"
        color="secondary"
        shape="round">
        <ButtonIcon icon={X} size="sm" />
      </Button>
    </View>
  )
}
