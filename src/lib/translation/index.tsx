import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {LayoutAnimation, Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {type TranslationTaskResult} from '@bsky.app/expo-translate-text/build/ExpoTranslateText.types'
import {useFocusEffect} from '@react-navigation/native'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {logger} from '#/logger'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {type TranslationState} from './types'

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
        targetLangCode = primaryLanguageTag ?? targetLangCodeOriginal
        break
    }
  }

  const {onTranslateTask} =
    // Needed in order to type check the dynamically imported module.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    require('@bsky.app/expo-translate-text') as typeof import('@bsky.app/expo-translate-text')
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
export function useTranslate({key}: {key: string}) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  useFocusEffect(
    useCallback(() => {
      if (!key) return
      const cleanup = context.acquireTranslation(key)
      return cleanup
    }, [key, context]),
  )

  const translate = useCallback(
    async (params: {
      text: string
      targetLangCode: string
      sourceLangCode?: string
      forceGoogleTranslate?: boolean
    }) => {
      return context.translate({...params, key})
    },
    [key, context],
  )

  const clearTranslation = useCallback(
    () => context.clearTranslation(key),
    [key, context],
  )

  return {
    translationState: context.translationState[key] ?? {
      status: 'idle',
    },
    translate,
    clearTranslation,
  }
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const [translationState, setTranslationState] = useState<
    Record<string, TranslationState>
  >({})
  const [refCounts, setRefCounts] = useState<Record<string, number>>({})
  const ax = useAnalytics()
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setTranslationState(prev => {
      delete prev[key]
      return {...prev}
    })
  }, [])

  const translate = useCallback(
    async ({
      key,
      text,
      targetLangCode,
      sourceLangCode,
      ...options
    }: {
      key: string
      text: string
      targetLangCode: string
      sourceLangCode?: string
      forceGoogleTranslate?: boolean
    }) => {
      if (options?.forceGoogleTranslate) {
        ax.metric('translate:result', {
          method: 'google-translate',
          os: Platform.OS,
          sourceLanguage: sourceLangCode ?? null,
          targetLanguage: targetLangCode,
        })
        await googleTranslate(text, targetLangCode, sourceLangCode)
        return
      }
      setTranslationState(prev => ({
        ...prev,
        [key]: {status: 'loading'},
      }))
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setTranslationState(prev => ({
          ...prev,
          [key]: {
            status: 'success',
            translatedText: result.translatedText,
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
          },
        }))
      } catch (e) {
        logger.error('Failed to translate post on device', {safeMessage: e})
        // On-device translation failed (language pack missing or user
        // dismissed the download prompt). Fall back to Google Translate.
        ax.metric('translate:result', {
          method: 'fallback-alert',
          os: Platform.OS,
          sourceLanguage: sourceLangCode ?? null,
          targetLanguage: targetLangCode,
        })
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setTranslationState(prev => ({
          ...prev,
          [key]: {status: 'idle'},
        }))
        await googleTranslate(text, targetLangCode, sourceLangCode)
      }
    },
    [ax, googleTranslate],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [acquireTranslation, clearTranslation, translate, translationState],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
