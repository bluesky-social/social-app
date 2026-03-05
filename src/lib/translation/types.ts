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
  | {
      status: 'error'
      message: string
    }

export type TranslationFunctionParams = {
  /**
   * The text to be translated.
   */
  text: string
  /**
   * The language to translate the text into.
   */
  targetLangCode: string
  /**
   * The source language of the text. Will auto-detect if not provided.
   */
  sourceLangCode?: string
}

export type TranslationFunction = (
  parameters: TranslationFunctionParams,
) => Promise<void>
