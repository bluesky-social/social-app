import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet, Keyboard} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export function SelectLangBtn() {
  const pal = usePalette('default')
  const store = useStores()

  const onPress = useCallback(async () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    store.shell.openModal({name: 'content-languages-settings'})
  }, [store])

  return (
    <TouchableOpacity
      testID="selectLangBtn"
      onPress={onPress}
      style={styles.button}
      hitSlop={HITSLOP}
      accessibilityRole="button"
      accessibilityLabel="Language selection"
      accessibilityHint="Opens screen or modal to select language of post">
      <FontAwesomeIcon
        icon={'language'}
        style={pal.link as FontAwesomeIconStyle}
        size={26}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
})
