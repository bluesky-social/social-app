import React from 'react'
import {
  createNativeEngine,
  isNativeEngineAvailable,
} from 'react-native-shiki-engine'
import {type HighlighterCore} from '@shikijs/core'
import {createHighlighterCore} from '@shikijs/core'

import {
  HighlighterContext,
  type HighlighterContextType,
} from '#/lib/shiki/HighlighterContext'
import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'

let highlighterInstance: HighlighterCore | null = null
let initializationPromise: Promise<void> | null = null

export function HighlighterProvider({children}: {children: React.ReactNode}) {
  const [isReady, setIsReady] = React.useState(false)

  const value = React.useMemo<HighlighterContextType>(
    () => ({
      initialize: async () => {
        if (!initializationPromise) {
          initializationPromise = (async () => {
            if (!isNativeEngineAvailable()) {
              throw new Error('Native engine not available.')
            }
            highlighterInstance = await createHighlighterCore({
              langs: shikiLangs,
              themes: shikiThemes,
              engine: createNativeEngine(),
            })
            setIsReady(true)
          })()
        }
        await initializationPromise
      },
      tokenize: (code, options) => {
        if (!highlighterInstance) {
          throw new Error(
            'Highlighter not initialized. Call initialize() first.',
          )
        }
        return highlighterInstance.codeToTokensBase(code, options)
      },
      dispose: () => {
        highlighterInstance?.dispose()
        highlighterInstance = null
        initializationPromise = null
        setIsReady(false)
      },
      isReady,
    }),
    [isReady],
  )

  return (
    <HighlighterContext.Provider value={value}>
      {children}
    </HighlighterContext.Provider>
  )
}

export default HighlighterProvider
