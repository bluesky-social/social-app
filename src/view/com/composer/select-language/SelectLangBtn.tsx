import {useCallback} from 'react'
import {Keyboard, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {toPostLanguages, useLanguagePrefs} from '#/state/preferences/languages'
import {fontWeight} from '#/alf/tokens'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'
import {codeToLanguageName} from '../../../../locale/helpers'

export function SelectLangBtn() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const langPrefs = useLanguagePrefs()

  const onPressMore = useCallback(async () => {
    if (isNative) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }
    }
    openModal({name: 'post-languages-settings'})
  }, [openModal])

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)

  return (
    <Button
      testID="selectLangBtn"
      onPress={onPressMore}
      variant="ghost"
      size="small"
      hitSlop={LANG_DROPDOWN_HITSLOP}
      label={_(msg`Language selection`)}
      accessibilityLabel={_(msg`Language selection`)}
      accessibilityHint={_(msg`Opens language settings`)}
      style={styles.button}>
      {postLanguagesPref.length > 0 ? (
        <Text style={[pal.link, styles.label]} numberOfLines={1}>
          {postLanguagesPref
            .map(lang => codeToLanguageName(lang, langPrefs.appLanguage))
            .join(', ')}
        </Text>
      ) : (
        <FontAwesomeIcon
          icon="language"
          style={pal.link as FontAwesomeIconStyle}
          size={26}
        />
      )}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 15,
  },
  label: {
    maxWidth: 100,
    fontWeight: fontWeight.bold,
  },
})
