import {useCallback, useSyncExternalStore} from 'react'
import {Platform} from 'react-native'
import {type TranslationTaskResult} from 'expo-translate-text/build/ExpoTranslateText.types'
import Emitter from 'eventemitter3'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getTranslatorLink} from '#/locale/helpers'
import {logger} from '#/logger'
import {useLanguagePrefs} from '#/state/preferences'
import {useAnalytics} from '#/analytics'

export type TranslationState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {
      status: 'success'
      translatedText: string
      sourceLanguage: TranslationTaskResult['sourceLanguage']
      targetLanguage: TranslationTaskResult['targetLanguage']
    }

const IDLE: TranslationState = {status: 'idle'}

const emitter = new Emitter()

// Note: Since we’re storing this in memory without clearing it, e.g., LRU,
// this could get large over time. Something to keep an eye out for.
const translations = new Map<string, TranslationState>()

/**
 * Syncs translations to an in-memory map to ensure the hook only re-renders
 * when the value changes for a given key.
 */
export function useTranslationState(key: string) {
  const getSnapshot = () => {
    return translations.get(key) ?? IDLE
  }

  const subscribe = (callback: () => void): (() => void) => {
    emitter.addListener(key, callback)
    return () => {
      emitter.removeListener(key, callback)
    }
  }

  const translationState = useSyncExternalStore(subscribe, getSnapshot)

  const setTranslation = useCallback(
    (newState: TranslationState) => {
      translations.set(key, newState)
      emitter.emit(key)
    },
    [key],
  )

  const clearTranslation = useCallback(() => {
    translations.delete(key)
    emitter.emit(key)
  }, [key])

  return {clearTranslation, setTranslation, translationState}
}

/**
 * Attempts on-device translation via expo-translate-text.
 * Uses a lazy import to avoid crashing if the native module isn't linked into
 * the current build.
 */
async function attemptTranslation(
  input: string,
  targetLangCodeOriginal: string,
  sourceLangCodeOriginal?: string,
): Promise<{
  translatedText: string
  targetLanguage: TranslationTaskResult['targetLanguage']
  sourceLanguage: TranslationTaskResult['sourceLanguage']
}> {
  // Note that Android only supports two-character language codes and will fail
  // on other input.
  // https://developers.google.com/android/reference/com/google/mlkit/nl/translate/TranslateLanguage
  const targetLangCode =
    Platform.OS === 'android'
      ? targetLangCodeOriginal.split('-')[0]
      : targetLangCodeOriginal
  const sourceLangCode =
    Platform.OS === 'android'
      ? sourceLangCodeOriginal?.split('-')[0]
      : sourceLangCodeOriginal

  const {onTranslateTask} =
    // Needed in order to type check the dynamically imported module.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    (await require('expo-translate-text')) as typeof import('expo-translate-text')
  const result = await onTranslateTask({
    input,
    targetLangCode,
    sourceLangCode,
  })
  return {
    translatedText:
      typeof result.translatedTexts === 'string' ? result.translatedTexts : '',
    targetLanguage: result.targetLanguage,
    sourceLanguage: result.sourceLanguage,
  }
}

/**
 * Native translation hook. Attempts on-device translation using Apple
 * Translation (iOS 18+) or Google ML Kit (Android).
 * Falls back to Google Translate URL if the language pack is unavailable.
 *
 * Web uses index.web.ts which always opens Google Translate.
 */
export function useTranslateOnDevice(key: string) {
  const {clearTranslation, setTranslation, translationState} =
    useTranslationState(key)
  const openLink = useOpenLink()
  const ax = useAnalytics()
  const {primaryLanguage} = useLanguagePrefs()

  const translate = useCallback(
    async (
      text: string,
      targetLangCode: string = primaryLanguage,
      sourceLangCode?: string,
    ) => {
      setTranslation({status: 'loading'})
      try {
        const result = await attemptTranslation(
          text,
          targetLangCode,
          sourceLangCode,
        )
        ax.metric('translate:result', {method: 'on-device'})
        setTranslation({
          status: 'success',
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
        })
      } catch (e) {
        logger.error('Failed to translate post on device', {safeMessage: e})
        // On-device translation failed (language pack missing or user dismissed
        // the download prompt). Fall back to Google Translate.
        ax.metric('translate:result', {method: 'fallback-alert'})
        setTranslation({status: 'idle'})
        const translateUrl = getTranslatorLink(
          text,
          targetLangCode,
          sourceLangCode,
        )
        await openLink(translateUrl)
      }
    },
    [ax, openLink, primaryLanguage, setTranslation],
  )
  return {clearTranslation, translate, translationState}
}
