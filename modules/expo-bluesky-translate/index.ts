import {Platform} from 'react-native'

import ExpoBlueskyTranslate from './src/ExpoBlueskyTranslate'

// can be something like "17.5.1", so just take the first two parts
const version = String(Platform.Version).split('.').slice(0, 2).join('.')

export const isAvailableIOS = Number(version) >= 17.4
export const isAvailableAndroid = true

// https://en.wikipedia.org/wiki/Translate_(Apple)#Languages
const SUPPORTED_LANGUAGES = [
  'ar',
  'zh',
  'nl',
  'en',
  'fr',
  'de',
  'id',
  'it',
  'ja',
  'ko',
  'pl',
  'pt',
  'ru',
  'es',
  'th',
  'tr',
  'uk',
  'vi',
]

export function isLanguageSupported(lang?: string) {
  // If the language is not provided, we assume it is supported
  if (!lang) return true
  return SUPPORTED_LANGUAGES.includes(lang)
}

export const isAvailable = Platform.select({
  ios: isAvailableIOS,
  android: isAvailableAndroid,
})

/**
 * Translates the given text to the target language.
 * @param sourceLanguage Source language code (IETF BCP-47 language tag)
 * @param targetLanguage Target language code (IETF BCP-47 language tag)
 * @param text Text to translate
 * @returns Translated text
 */
export async function translateAsync(
  sourceLanguage: string,
  targetLanguage: string,
  text: string,
): Promise<string> {
  return await ExpoBlueskyTranslate.translateAsync(
    sourceLanguage,
    targetLanguage,
    text,
  )
}

export {
  NativeTranslationModule,
  NativeTranslationView,
} from './src/ExpoBlueskyTranslateView'
