import {createNativeEngine} from 'react-native-shiki-engine'
import {createHighlighterCoreSync, type HighlighterCore} from '@shikijs/core'

import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'

let highlighterSingleton: HighlighterCore | null = null
export const DEFAULT_THEME_NAME = 'nord'

export function getHighlighter(): HighlighterCore {
  if (!highlighterSingleton) {
    highlighterSingleton = createHighlighterCoreSync({
      themes: shikiThemes,
      langs: shikiLangs,
      engine: createNativeEngine({maxCacheSize: 1000}),
    })
  }
  return highlighterSingleton
}
