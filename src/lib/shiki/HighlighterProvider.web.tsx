import {useSyncExternalStore} from 'react'
import {createHighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'

import {
  createHighlighterStore,
  HighlighterContext,
} from '#/lib/shiki/HighlighterContext'
import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'
const highlighter = createHighlighterStore(() =>
  createHighlighterCore({
    langs: shikiLangs,
    themes: shikiThemes,
    engine: createOnigurumaEngine(
      import('@shikijs/engine-oniguruma/wasm-inlined'),
    ),
  }),
)

export default function HighlighterProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const isReady = useSyncExternalStore(
    highlighter.subscribe,
    highlighter.getIsReady,
    highlighter.getIsReady,
  )

  return (
    <HighlighterContext.Provider value={{...highlighter, isReady}}>
      {children}
    </HighlighterContext.Provider>
  )
}
