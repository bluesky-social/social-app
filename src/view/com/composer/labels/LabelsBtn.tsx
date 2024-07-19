import React from 'react'
import {Keyboard, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModalControls} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {ShieldExclamation} from 'lib/icons'
import {isNative} from 'platform/detection'
import {Button} from 'view/com/util/forms/Button'

export function LabelsBtn({
  labels,
  hasMedia,
  onChange,
}: {
  labels: string[]
  hasMedia: boolean
  onChange: (v: string[]) => void
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openModal} = useModalControls()

  return (
    <Button
      type="default-light"
      testID="labelsBtn"
      style={[styles.button, !hasMedia && styles.dimmed]}
      accessibilityLabel={_(msg`Content warnings`)}
      accessibilityHint=""
      onPress={() => {
        if (isNative) {
          if (Keyboard.isVisible()) {
            Keyboard.dismiss()
          }
        }
        openModal({name: 'self-label', labels, hasMedia, onChange})
      }}>
      <ShieldExclamation style={pal.link} size={24} />
      {labels.length > 0 ? (
        <FontAwesomeIcon
          icon="check"
          size={16}
          style={pal.link as FontAwesomeIconStyle}
        />
      ) : null}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  dimmed: {
    opacity: 0.4,
  },
  label: {
    maxWidth: 100,
  },
})
