import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {LayoutAnimation, Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {onTranslateTask} from '@bsky.app/expo-translate-text'
import {type TranslationTaskResult} from '@bsky.app/expo-translate-text/build/ExpoTranslateText.types'
import {useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {codeToLanguageName} from '#/locale/helpers'
import {logger} from '#/logger'
import {useLanguagePrefs} from '#/state/preferences'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_IOS, IS_TRANSLATION_SUPPORTED} from '#/env'
import {Context} from './context'
import {
  type ContextType,
  type TranslationFunctionParams,
  type TranslationOptions,
  type TranslationState,
} from './types'
import {guessLanguage} from './utils'

export * from './types'
export * from './utils'

const E_SAME_AS_SOURCE_LANGUAGE =
  'Translation result is the same as the source text.'
const E_EMPTY_RESULT = 'Translation result is empty.'
const E_INVALID_SOURCE_LANGUAGE = 'Invalid source language'

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
  let targetLangCode = IS_ANDROID
    ? targetLangCodeOriginal.split('-')[0]
    : targetLangCodeOriginal
  const sourceLangCode = IS_ANDROID
    ? sourceLangCodeOriginal?.split('-')[0]
    : sourceLangCodeOriginal

  // Special cases for regional languages since iOS differentiates and missing
  // language packs must be downloaded and installed.
  if (IS_IOS) {
    const deviceLocales = getLocales()
    const primaryLanguageTag = deviceLocales[0]?.languageTag
    switch (targetLangCodeOriginal) {
      case 'en': // en-US, en-GB
      case 'es': // es-419, es-ES
      case 'pt': // pt-BR, pt-PT
      case 'zh': // zh-Hans-CN, zh-Hant-HK, zh-Hant-TW
        if (
          primaryLanguageTag &&
          primaryLanguageTag.startsWith(targetLangCodeOriginal)
        ) {
          targetLangCode = primaryLanguageTag
        }
        break
    }
  }

  const result = await onTranslateTask({
    input,
    targetLangCode,
    sourceLangCode,
  })

  // Since `input` is always a string, the result should always be a string.
  const translatedText =
    typeof result.translatedTexts === 'string' ? result.translatedTexts : ''

  if (translatedText === input) {
    throw new Error(E_SAME_AS_SOURCE_LANGUAGE)
  }

  if (translatedText === '') {
    throw new Error(E_EMPTY_RESULT)
  }

  return {
    translatedText,
    targetLanguage: result.targetLanguage,
    sourceLanguage:
      result.sourceLanguage ?? sourceLangCode ?? guessLanguage(input), // iOS doesn't return the source language
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
export function useTranslate({
  key,
  forceGoogleTranslate = false,
}: TranslationOptions) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  useFocusEffect(
    useCallback(() => {
      const cleanup = context.acquireTranslation(key)
      return cleanup
    }, [key, context]),
  )

  const translate = useCallback(
    async (params: TranslationFunctionParams) => {
      return context.translate(
        {
          ...params,
        },
        {
          key,
          forceGoogleTranslate,
        },
      )
    },
    [context, forceGoogleTranslate, key],
  )

  const clearTranslation = useCallback(
    () => context.clearTranslation(key),
    [context, key],
  )

  return useMemo(
    () => ({
      translationState: context.translationState[key] ?? {
        status: 'idle',
      },
      translate,
      clearTranslation,
    }),
    [clearTranslation, context.translationState, key, translate],
  )
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const [translationState, setTranslationState] = useState<
    Record<string, TranslationState>
  >({})
  const [refCounts, setRefCounts] = useState<Record<string, number>>({})
  const ax = useAnalytics()
  const langPrefs = useLanguagePrefs()
  const {t: l} = useLingui()
  const googleTranslate = useGoogleTranslate()

  useEffect(() => {
    setTranslationState(prev => {
      const keysToDelete: string[] = []

      for (const key of Object.keys(prev)) {
        if ((refCounts[key] ?? 0) <= 0) {
          keysToDelete.push(key)
        }
      }

      if (keysToDelete.length > 0) {
        const newState = {...prev}
        keysToDelete.forEach(key => {
          delete newState[key]
        })
        return newState
      }

      return prev
    })
  }, [refCounts])

  const acquireTranslation = useCallback((key: string) => {
    setRefCounts(prev => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }))

    return () => {
      setRefCounts(prev => {
        const newCount = (prev[key] ?? 1) - 1
        if (newCount <= 0) {
          const {[key]: _, ...rest} = prev
          return rest
        }
        return {...prev, [key]: newCount}
      })
    }
  }, [])

  const clearTranslation = useCallback((key: string) => {
    if (!IS_ANDROID) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    setTranslationState(prev => {
      delete prev[key]
      return {...prev}
    })
  }, [])

  const translate = useCallback<ContextType['translate']>(
    async (
      {
        text,
        expectedTargetLanguage,
        expectedSourceLanguage,
        possibleSourceLanguages,
        forceGoogleTranslate: forceGoogleTranslateOverride,
      },
      {key, forceGoogleTranslate},
    ) => {
      const shouldForceGoogleTranslate = Boolean(
        forceGoogleTranslateOverride ?? forceGoogleTranslate,
      )

      ax.metric('translate', {
        os: Platform.OS,
        possibleSourceLanguages,
        expectedTargetLanguage: expectedTargetLanguage,
        textLength: text.length,
        googleTranslate: shouldForceGoogleTranslate,
      })

      if (shouldForceGoogleTranslate || !IS_TRANSLATION_SUPPORTED) {
        await googleTranslate(
          text,
          expectedTargetLanguage,
          expectedSourceLanguage,
        )
        return
      }

      if (!IS_ANDROID) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      }
      setTranslationState(prev => ({
        ...prev,
        [key]: {status: 'loading'},
      }))
      try {
        const result = await attemptTranslation(
          text,
          expectedTargetLanguage,
          expectedSourceLanguage,
        )
        ax.metric('translate:result', {
          success: true,
          os: Platform.OS,
          possibleSourceLanguages,
          expectedSourceLanguage: expectedSourceLanguage ?? null,
          expectedTargetLanguage,
          resultSourceLanguage: result.sourceLanguage,
          resultTargetLanguage: result.targetLanguage,
          textLength: text.length,
        })
        if (!IS_ANDROID) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }
        setTranslationState(prev => ({
          ...prev,
          [key]: {
            status: 'success',
            translatedText: result.translatedText,
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            postLanguages: possibleSourceLanguages,
          },
        }))
      } catch (err) {
        const e = err as Error
        logger.error('Failed to translate text on device', {safeMessage: e})
        // On-device translation failed (language pack missing or user
        // dismissed the download prompt).
        ax.metric('translate:result', {
          success: false,
          os: Platform.OS,
          possibleSourceLanguages,
          expectedSourceLanguage: expectedSourceLanguage ?? null,
          expectedTargetLanguage,
          resultSourceLanguage: null,
          resultTargetLanguage: null,
          textLength: text.length,
        })
        let errorMessage = l`Device failed to translate :(`
        if (e.message === E_SAME_AS_SOURCE_LANGUAGE) {
          errorMessage = l`Translation to the same language is unavailable on your device.`
        }
        if (e.message === E_EMPTY_RESULT) {
          errorMessage = l`No translation received from your device.`
        }
        if (
          expectedSourceLanguage &&
          e.message.includes(E_INVALID_SOURCE_LANGUAGE)
        ) {
          errorMessage = l`${codeToLanguageName(
            expectedSourceLanguage,
            langPrefs.appLanguage,
          )} is not supported by your device.`
        }
        if (!IS_ANDROID) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }
        setTranslationState(prev => ({
          ...prev,
          [key]: {status: 'error', message: errorMessage},
        }))
      }
    },
    [ax, googleTranslate, l, langPrefs.appLanguage],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [acquireTranslation, clearTranslation, translate, translationState],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
