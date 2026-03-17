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
  expectedTargetLanguage: string
  /**
   * We auto-detect the source language by default, but the user has the option
   * to specify a source language if they want to. If this value is present, it
   * means the user selected a source language, or we were certain of the
   * source language and want to specify it explicitly.
   */
  expectedSourceLanguage?: string
  /**
   * The languages the content might be in, such as the user-supplied
   * language codes on posts. Currently only available on posts.
   */
  possibleSourceLanguages?: string[]
  /**
   * Override the default behavior and always use Google Translate.
   */
  forceGoogleTranslate?: boolean
}

export type TranslationOptions = {
  /**
   * A unique key to identify this translation instance e.g. the post URI
   */
  key: string
  /**
   * Override the default behavior and always use Google Translate.
   */
  forceGoogleTranslate?: boolean
}

export type TranslationFunction = (
  params: TranslationFunctionParams,
) => Promise<void>

export type ContextType = {
  translationState: Record<string, TranslationState>
  translate: (
    params: TranslationFunctionParams,
    options: TranslationOptions,
  ) => Promise<void>
  clearTranslation: (key: string) => void
  acquireTranslation: (key: string) => () => void
}
