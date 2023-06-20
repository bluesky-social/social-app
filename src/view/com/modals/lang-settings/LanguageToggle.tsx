import React from 'react'
import {StyleSheet} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {useStores} from 'state/index'

export const LanguageToggle = observer(
  ({
    code2,
    name,
    onPress,
    langType,
  }: {
    code2: string
    name: string
    onPress: () => void
    langType: 'contentLanguages' | 'postLanguages'
  }) => {
    const pal = usePalette('default')
    const store = useStores()

    return (
      <ToggleButton
        label={name}
        isSelected={store.preferences[langType].includes(code2)}
        onPress={onPress}
        style={[pal.border, styles.languageToggle]}
      />
    )
  },
)

const styles = StyleSheet.create({
  languageToggle: {
    borderTopWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
})
