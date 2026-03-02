import {createContext} from 'react'

import {type Options, type TranslationState} from './types'

export const Context = createContext<{
  translationState: Record<string, TranslationState>
  translate: (
    key: string,
    text: string,
    targetLangCode: string,
    sourceLangCode?: string,
    options?: Options,
  ) => Promise<void>
  clearTranslation: (key: string) => void
  acquireTranslation: (key: string) => () => void
} | null>(null)
Context.displayName = 'TranslationContext'
