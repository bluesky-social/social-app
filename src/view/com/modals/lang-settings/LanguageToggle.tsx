import {StyleSheet} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {toPostLanguages, useLanguagePrefs} from '#/state/preferences/languages'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'

export function LanguageToggle({
  code2,
  name,
  onPress,
  langType,
}: {
  code2: string
  name: string
  onPress: () => void
  langType: 'contentLanguages' | 'postLanguages'
}) {
  const pal = usePalette('default')
  const langPrefs = useLanguagePrefs()

  const values =
    langType === 'contentLanguages'
      ? langPrefs.contentLanguages
      : toPostLanguages(langPrefs.postLanguage)
  const isSelected = values.includes(code2)

  // enforce a max of 3 selections for post languages
  let isDisabled = false
  if (langType === 'postLanguages' && values.length >= 3 && !isSelected) {
    isDisabled = true
  }

  return (
    <ToggleButton
      label={name}
      isSelected={isSelected}
      onPress={isDisabled ? undefined : onPress}
      style={[pal.border, styles.languageToggle, isDisabled && styles.dimmed]}
    />
  )
}

const styles = StyleSheet.create({
  languageToggle: {
    borderTopWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  dimmed: {
    opacity: 0.5,
  },
})
