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
   * We auto-detect the source language by default, but the user has the option
   * to specify a source language if they want to. If this value is present, it
   * means the user selected a source language, or we were certain of the
   * source language and want to specify it explicitly.
   */
  sourceLangCode?: string
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
