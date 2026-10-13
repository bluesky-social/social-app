import {useSyncExternalStore} from 'react'
import {
  createNativeEngine,
  isNativeEngineAvailable,
} from 'react-native-shiki-engine'
import {createHighlighterCore} from '@shikijs/core'

import {
  createHighlighterStore,
  HighlighterContext,
} from '#/lib/shiki/HighlighterContext'
import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'
const highlighter = createHighlighterStore(async () => {
  if (!isNativeEngineAvailable())
    throw new Error('Native engine not available.')
  return createHighlighterCore({
    langs: shikiLangs,
    themes: shikiThemes,
    engine: createNativeEngine(),
  })
})

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
