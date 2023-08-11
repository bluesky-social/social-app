import React from 'react'
import {Keyboard, StyleSheet} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Button} from 'view/com/util/forms/Button'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {ShieldExclamation} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {isNative} from 'platform/detection'

export const LabelsBtn = observer(function LabelsBtn({
  labels,
  onChange,
}: {
  labels: string[]
  onChange: (v: string[]) => void
}) {
  const pal = usePalette('default')
  const store = useStores()

  return (
    <Button
      type="default-light"
      testID="labelsBtn"
      style={styles.button}
      accessibilityLabel="Content warnings"
      accessibilityHint=""
      onPress={() => {
        if (isNative) {
          if (Keyboard.isVisible()) {
            Keyboard.dismiss()
          }
        }
        store.shell.openModal({name: 'self-label', labels, onChange})
      }}>
      <ShieldExclamation style={pal.link} size={26} />
      {labels.length > 0 ? (
        <FontAwesomeIcon
          icon="check"
          size={16}
          style={pal.link as FontAwesomeIconStyle}
        />
      ) : null}
    </Button>
  )
})

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginRight: 4,
  },
  label: {
    maxWidth: 100,
  },
})
