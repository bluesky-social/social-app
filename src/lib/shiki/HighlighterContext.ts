import {createContext, useContext} from 'react'
import {type ThemedToken} from '@shikijs/core'

export interface HighlighterContextType {
  initialize: () => Promise<void>
  tokenize: (
    code: string,
    options: {lang: string; theme: string},
  ) => ThemedToken[][]
  dispose: () => void
  isReady: boolean
}

export const HighlighterContext =
  createContext<HighlighterContextType | null>(null)

export function useHighlighter(): HighlighterContextType {
  const ctx = useContext(HighlighterContext)
  if (!ctx)
    throw new Error('HighlighterProvider missing in component tree')
  return ctx
}
