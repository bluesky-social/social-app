import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet, Keyboard} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {isNative} from 'platform/detection'
import {codeToLanguageName} from '../../../../locale/helpers'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export const SelectLangBtn = observer(function SelectLangBtn() {
  const pal = usePalette('default')
  const store = useStores()

  const onPress = useCallback(async () => {
    if (isNative) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }
    }
    store.shell.openModal({name: 'post-languages-settings'})
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
      {store.preferences.postLanguages.length > 0 ? (
        <Text type="lg-bold" style={[pal.link, styles.label]} numberOfLines={1}>
          {store.preferences.postLanguages
            .map(lang => codeToLanguageName(lang))
            .join(', ')}
        </Text>
      ) : (
        <FontAwesomeIcon
          icon="language"
          style={pal.link as FontAwesomeIconStyle}
          size={26}
        />
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
  label: {
    maxWidth: 100,
  },
})
