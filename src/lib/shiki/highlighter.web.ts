import {createHighlighterCore, type HighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine, loadWasm} from '@shikijs/engine-oniguruma'
import wasm from '@shikijs/engine-oniguruma/wasm-inlined'

import {shikiLangs} from '#/lib/shiki/langs'
import {shikiThemes} from '#/lib/shiki/themes'

let highlighterSingleton: HighlighterCore | null = null
let highlighterPromise: Promise<HighlighterCore> | null = null
export const DEFAULT_THEME_NAME = 'nord'

function init() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      await loadWasm(wasm)
      const engine = await createOnigurumaEngine()
      const instance = await createHighlighterCore({
        themes: shikiThemes,
        langs: shikiLangs,
        engine,
      })
      highlighterSingleton = instance
      return instance
    })()
  }
}

export function getHighlighterMaybe(): HighlighterCore | null {
  if (!highlighterSingleton) init()
  return highlighterSingleton
}
