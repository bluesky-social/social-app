import {createContext} from 'react'

import {type TranslationState} from './types'

export const Context = createContext<{
  translationState: Record<string, TranslationState>
  translate: (parameters: {
    key: string
    text: string
    targetLangCode: string
    sourceLangCode?: string
    /**
     * Whether to force the use of Google Translate. Default is false.
     */
    forceGoogleTranslate?: boolean
  }) => Promise<void>
  clearTranslation: (key: string) => void
  acquireTranslation: (key: string) => () => void
} | null>(null)
Context.displayName = 'TranslationContext'
