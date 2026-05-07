import {useCallback, useContext, useMemo} from 'react'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {
  type ContextType,
  type TranslationFunctionParams,
  type TranslationOptions,
  type TranslationState,
} from './types'

export * from './types'
export * from './utils'

const translationState: Record<string, TranslationState> = {}
const acquireTranslation = (_key: string) => {
  return () => {}
}
const clearTranslation = (_key: string) => {}

/**
 * Web always opens Google Translate.
 */
export function useTranslate({key}: TranslationOptions) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  // Always call hooks in consistent order
  const translate = useCallback(
    async (params: TranslationFunctionParams) => {
      return context.translate(
        {
          ...params,
        },
        {
          key,
          forceGoogleTranslate: true,
        },
      )
    },
    [key, context],
  )

  const clearTranslation = useCallback(() => {
    return context.clearTranslation(key)
  }, [key, context])

  return {
    translationState: context.translationState[key] ?? {
      status: 'idle' as const,
    },
    translate,
    clearTranslation,
  }
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const ax = useAnalytics()
  const googleTranslate = useGoogleTranslate()

  const translate = useCallback<ContextType['translate']>(
    async ({
      text,
      expectedTargetLanguage,
      expectedSourceLanguage,
      possibleSourceLanguages,
    }) => {
      ax.metric('translate', {
        os: 'web',
        possibleSourceLanguages,
        expectedTargetLanguage,
        textLength: text.length,
        googleTranslate: true,
      })
      await googleTranslate(
        text,
        expectedTargetLanguage,
        expectedSourceLanguage,
      )
    },
    [ax, googleTranslate],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [translate],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
