import React from 'react'
import {type HighlighterCore} from '@shikijs/core'
import {createHighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine, loadWasm} from '@shikijs/engine-oniguruma'
import wasm from '@shikijs/engine-oniguruma/wasm-inlined'

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
            await loadWasm(wasm)
            const engine = await createOnigurumaEngine()
            highlighterInstance = await createHighlighterCore({
              langs: shikiLangs,
              themes: shikiThemes,
              engine,
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
