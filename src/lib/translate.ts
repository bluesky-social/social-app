import {useCallback} from 'react'

import {getTranslatorLink} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences'
import {useNativeTranslationDisabled} from '#/state/preferences/disable-native-translation'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {
  isAvailable,
  isLanguageSupported,
  NativeTranslationModule,
} from '../../modules/expo-bluesky-translate'

export function useTranslate() {
  const openLink = useOpenLink()
  const disabled = useNativeTranslationDisabled()
  const langPrefs = useLanguagePrefs()

  return useCallback(
    (text: string, lang?: string) => {
      if (
        isAvailable &&
        !disabled &&
        isLanguageSupported(lang) &&
        isLanguageSupported(langPrefs.primaryLanguage)
      ) {
        NativeTranslationModule.presentAsync(text)
      } else {
        openLink(getTranslatorLink(text, langPrefs.primaryLanguage))
      }
    },
    [openLink, disabled, langPrefs.primaryLanguage],
  )
}
