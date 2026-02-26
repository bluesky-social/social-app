import {useCallback, useState} from 'react'
import {Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {type TranslationTaskResult} from '@bsky.app/expo-translate-text/build/ExpoTranslateText.types'

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

/**
 * Attempts on-device translation via @bsky.app/expo-translate-text.
 * Uses a lazy import to avoid crashing if the native module isn't linked into
 * the current build.
 */
async function attemptTranslation(
  input: string,
  targetLangCodeOriginal: string,
  sourceLangCodeOriginal?: string, // Auto-detects if not provided
): Promise<{
  translatedText: string
  targetLanguage: TranslationTaskResult['targetLanguage']
  sourceLanguage: TranslationTaskResult['sourceLanguage']
}> {
  // Note that Android only supports two-character language codes and will fail
  // on other input.
  // https://developers.google.com/android/reference/com/google/mlkit/nl/translate/TranslateLanguage
  let targetLangCode =
    Platform.OS === 'android'
      ? targetLangCodeOriginal.split('-')[0]
      : targetLangCodeOriginal
  const sourceLangCode =
    Platform.OS === 'android'
      ? sourceLangCodeOriginal?.split('-')[0]
      : sourceLangCodeOriginal

  // Special cases for regional languages
  if (Platform.OS !== 'android') {
    const deviceLocales = getLocales()
    const primaryLanguageTag = deviceLocales[0]?.languageTag
    switch (targetLangCodeOriginal) {
      case 'en': // en-US, en-GB
      case 'es': // es-419, es-ES
      case 'pt': // pt-BR, pt-PT
      case 'zh': // zh-Hans-CN, zh-Hant-HK, zh-Hant-TW
        targetLangCode = primaryLanguageTag
        break
    }
  }

  const {onTranslateTask} =
    // Needed in order to type check the dynamically imported module.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    (await require('@bsky.app/expo-translate-text')) as typeof import('@bsky.app/expo-translate-text')
  const result = await onTranslateTask({
    input,
    targetLangCode,
    sourceLangCode,
  })

  // Since `input` is always a string, the result should always be a string.
  return {
    translatedText:
      typeof result.translatedTexts === 'string' ? result.translatedTexts : '',
    targetLanguage: result.targetLanguage,
    sourceLanguage: result.sourceLanguage ?? sourceLangCode ?? null, // iOS doesn't return the source language
  }
}

/**
 * Native translation hook. Attempts on-device translation using Apple
 * Translation (iOS 18+) or Google ML Kit (Android).
 *
 * Falls back to Google Translate URL if the language pack is unavailable.
 *
 * Web uses index.web.ts which always opens Google Translate.
 */
export function useTranslateOnDevice() {
  const [translationState, setTranslationState] =
    useState<TranslationState>(IDLE)
  const openLink = useOpenLink()
  const ax = useAnalytics()
  const {primaryLanguage} = useLanguagePrefs()

  const clearTranslation = () => {
    setTranslationState(IDLE)
  }

  const translate = useCallback(
    async (
      text: string,
      targetLangCode: string = primaryLanguage,
      sourceLangCode?: string,
    ) => {
      setTranslationState({status: 'loading'})
      try {
        const result = await attemptTranslation(
          text,
          targetLangCode,
          sourceLangCode,
        )
        ax.metric('translate:result', {
          method: 'on-device',
          os: Platform.OS,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
        })
        setTranslationState({
          status: 'success',
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
        })
      } catch (e) {
        logger.error('Failed to translate post on device', {safeMessage: e})
        // On-device translation failed (language pack missing or user dismissed
        // the download prompt). Fall back to Google Translate.
        ax.metric('translate:result', {
          method: 'fallback-alert',
          os: Platform.OS,
          sourceLanguage: sourceLangCode ?? null,
          targetLanguage: targetLangCode,
        })
        setTranslationState({status: 'idle'})
        const translateUrl = getTranslatorLink(
          text,
          targetLangCode,
          sourceLangCode,
        )
        await openLink(translateUrl)
      }
    },
    [ax, openLink, primaryLanguage, setTranslationState],
  )

  return {clearTranslation, translate, translationState}
}
