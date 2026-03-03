import {useCallback, useContext, useMemo} from 'react'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {type TranslationState} from './types'

const translationState: Record<string, TranslationState> = {}
const acquireTranslation = (_key: string) => {
  return () => {}
}
const clearTranslation = (_key: string) => {}

/**
 * Web always opens Google Translate.
 */
export function useTranslate(key: string) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  // Always call hooks in consistent order
  const translate = useCallback(
    async (params: {
      text: string
      targetLangCode: string
      sourceLangCode?: string
    }) => {
      if (!key) {
        throw new Error(
          'translate requires a key. Either pass key to useTranslate() or use context.translate() with key parameter',
        )
      }
      return context.translate({...params, key})
    },
    [key, context],
  )

  const clearTranslation = useCallback(() => {
    if (!key) {
      throw new Error(
        'clearTranslation requires a key. Either pass key to useTranslate() or use context.clearTranslation() with key parameter',
      )
    }
    return context.clearTranslation(key)
  }, [key, context])

  // If a key is provided, return wrapped versions that automatically use the key
  if (key) {
    return {
      translationState: context.translationState[key] ?? {
        status: 'idle' as const,
      },
      translate,
      clearTranslation,
    }
  }

  return context
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const ax = useAnalytics()
  const googleTranslate = useGoogleTranslate()

  const translate = useCallback(
    async ({
      text,
      targetLangCode,
      sourceLangCode,
    }: {
      key: string
      text: string
      targetLangCode: string
      sourceLangCode?: string
    }) => {
      ax.metric('translate:result', {
        method: 'google-translate',
        os: 'web',
        sourceLanguage: sourceLangCode ?? null,
        targetLanguage: targetLangCode,
      })
      await googleTranslate(text, targetLangCode, sourceLangCode)
    },
    [ax, googleTranslate],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [translate],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
