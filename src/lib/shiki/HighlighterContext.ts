import React from 'react'
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
  React.createContext<HighlighterContextType | null>(null)

export function useHighlighter(): HighlighterContextType {
  const ctx = React.useContext(HighlighterContext)
  if (!ctx) {
    throw new Error('HighlighterProvider missing in component tree')
  }
  return ctx
}
