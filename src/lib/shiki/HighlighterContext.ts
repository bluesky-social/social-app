import {createContext, useContext} from 'react'
import {type HighlighterCore, type ThemedToken} from '@shikijs/core'

import {tokenizeCode} from '#/lib/shiki/tokenize'

export interface HighlighterContextType {
  initialize: () => Promise<void>
  tokenize: (
    code: string,
    options: {lang: string; theme: string},
  ) => ThemedToken[][]
  dispose: () => void
  isReady: boolean
}

export const HighlighterContext = createContext<HighlighterContextType | null>(
  null,
)

/**
 * Share a lazy highlighter across provider remounts without retaining React
 * state setters or caching failed initialization attempts.
 */
export function createHighlighterStore(
  createHighlighter: () => Promise<HighlighterCore>,
) {
  let instance: HighlighterCore | null = null
  let initializationPromise: Promise<void> | null = null
  let generation = 0
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) listener()
  }

  async function initialize() {
    if (instance) return

    if (!initializationPromise) {
      const currentGeneration = generation
      const attempt = (async () => {
        const highlighter = await createHighlighter()
        if (generation !== currentGeneration) {
          highlighter.dispose()
          return
        }
        instance = highlighter
        notify()
      })()
      initializationPromise = attempt
      try {
        await attempt
      } finally {
        if (initializationPromise === attempt) initializationPromise = null
      }
    } else {
      await initializationPromise
    }
  }

  return {
    initialize,
    tokenize: (code: string, options: {lang: string; theme: string}) => {
      if (!instance)
        throw new Error('Highlighter not initialized. Call initialize() first.')
      return tokenizeCode(instance, code, options)
    },
    dispose: () => {
      generation++
      instance?.dispose()
      instance = null
      initializationPromise = null
      notify()
    },
    getIsReady: () => instance !== null,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useHighlighter(): HighlighterContextType {
  const ctx = useContext(HighlighterContext)
  if (!ctx) throw new Error('HighlighterProvider missing in component tree')
  return ctx
}
