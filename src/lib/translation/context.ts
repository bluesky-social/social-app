import {createContext} from 'react'

import {type TranslationFunctionParams, type TranslationState} from './types'

export const Context = createContext<{
  translationState: Record<string, TranslationState>
  translate: (
    parameters: TranslationFunctionParams & {
      key: string
      forceGoogleTranslate: boolean
    },
  ) => Promise<void>
  clearTranslation: (key: string) => void
  acquireTranslation: (key: string) => () => void
} | null>(null)
Context.displayName = 'TranslationContext'
