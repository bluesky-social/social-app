import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'

export const RemovePostBtn = ({onPress}: {onPress?: () => void}) => {
  const {_} = useLingui()

  return (
    <Button
      testID="removePostBtn"
      label={_(msg`Remove this post`)}
      accessibilityHint={''}
      onPress={onPress}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary">
      <Times size="md" />
    </Button>
  )
}
