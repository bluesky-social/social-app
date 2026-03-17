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
  /**
   * Whether we auto-detected the language or it was selected manually. Defaults to 'automatic'.
   */
  sourceSelection?: 'automatic' | 'manual'
}

export type TranslationOptions = {
  key: string
  forceGoogleTranslate?: boolean
  /**
   * The language(s) of the post being translated. Used for analytics purposes
   * to understand translation usage patterns better. Optional because it may
   * not always be available (e.g. if the post text is empty or if the
   * translation is triggered from a non-post
   * context).
   */
  postLangCodes?: string[]
}

export type TranslationFunction = (
  parameters: TranslationFunctionParams,
) => Promise<void>

export type ContextType = {
  translationState: Record<string, TranslationState>
  translate: (
    parameters: TranslationFunctionParams & TranslationOptions,
  ) => Promise<void>
  clearTranslation: (key: string) => void
  acquireTranslation: (key: string) => () => void
}
