import {useCallback, useContext, useMemo} from 'react'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {useLanguagePrefs} from '#/state/preferences'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {type Options, type TranslationState} from './types'

const translationState: Record<string, TranslationState> = {}
const acquireTranslation = (_key: string) => {
  return () => {}
}
const clearTranslation = (_key: string) => {}

export function useTranslationKey(_key: string) {}

/**
 * Web always opens Google Translate.
 */
export function useTranslate() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }
  return context
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const ax = useAnalytics()
  const {primaryLanguage} = useLanguagePrefs()
  const googleTranslate = useGoogleTranslate()

  const translate = useCallback(
    async (
      _key: string,
      text: string,
      targetLangCode: string = primaryLanguage,
      sourceLangCode?: string,
      _options?: Options,
    ) => {
      ax.metric('translate:result', {
        method: 'google-translate',
        os: 'web',
        sourceLanguage: sourceLangCode ?? null,
        targetLanguage: targetLangCode,
      })
      await googleTranslate(text, targetLangCode, sourceLangCode)
    },
    [ax, googleTranslate, primaryLanguage],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [translate],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
