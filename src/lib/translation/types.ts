import {type TranslationTaskResult} from '@bsky.app/expo-translate-text/build/ExpoTranslateText.types'

export type TranslationState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {
      status: 'success'
      translatedText: string
      sourceLanguage: TranslationTaskResult['sourceLanguage']
      targetLanguage: TranslationTaskResult['targetLanguage']
    }

export type Options = {
  /**
   * Whether to force the use of Google Translate. Default is false.
   */
  googleTranslate?: boolean
}
