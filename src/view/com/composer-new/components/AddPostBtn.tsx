import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'

export const AddPostBtn = ({
  disabled,
  onPress,
}: {
  disabled?: boolean
  onPress?: () => void
}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      label={_(msg`Add new post`)}
      onPress={onPress}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <FontAwesomeIcon
        icon="add"
        size={20}
        color={!disabled ? t.palette.primary_500 : t.palette.contrast_400}
      />
    </Button>
  )
}
