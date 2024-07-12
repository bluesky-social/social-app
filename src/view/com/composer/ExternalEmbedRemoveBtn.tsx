import React from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {s} from 'lib/styles'

export function ExternalEmbedRemoveBtn({onRemove}: {onRemove: () => void}) {
  const {_} = useLingui()

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        height: 36,
        width: 36,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Remove image preview`)}
      accessibilityHint={_(msg`Removes the image preview`)}
      onAccessibilityEscape={onRemove}>
      <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
    </TouchableOpacity>
  )
}
