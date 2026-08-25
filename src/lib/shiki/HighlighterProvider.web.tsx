import {type ReactNode, useMemo, useState} from 'react'
import {type HighlighterCore} from '@shikijs/core'
import {createHighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'

import {
  HighlighterContext,
  type HighlighterContextType,
} from '#/lib/shiki/HighlighterContext'
import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'

let highlighterInstance: HighlighterCore | null = null
let initializationPromise: Promise<void> | null = null

export default function HighlighterProvider({children}: {children: ReactNode}) {
  const [isReady, setIsReady] = useState(false)

  const value = useMemo<HighlighterContextType>(
    () => ({
      initialize: async () => {
        if (!initializationPromise) {
          initializationPromise = (async () => {
            highlighterInstance = await createHighlighterCore({
              langs: shikiLangs,
              themes: shikiThemes,
              engine: createOnigurumaEngine(
                import('@shikijs/engine-oniguruma/wasm-inlined'),
              ),
            })
            setIsReady(true)
          })()
        }
        await initializationPromise
      },
      tokenize: (code, options) => {
        if (!highlighterInstance)
          throw new Error(
            'Highlighter not initialized. Call initialize() first.',
          )
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
