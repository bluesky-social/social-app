import ExpoBlueskyTranslate from './ExpoBlueskyTranslate'
import {ExpoBlueskyTranslateModule} from './ExpoBlueskyTranslate.types'

export const NativeTranslationModule: ExpoBlueskyTranslateModule = {
  presentAsync: async (_: string) => {},
  translateAsync: (sourceLanguage, targetLanguage, text) => {
    return ExpoBlueskyTranslate.translateAsync(
      sourceLanguage,
      targetLanguage,
      text,
    )
  },
}

export function NativeTranslationView() {
  return null
}
