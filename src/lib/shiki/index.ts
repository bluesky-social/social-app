import {useSyncExternalStore} from 'react'
import {type ThemeName} from '@bsky.app/alf'
import {
  createHighlighterCore,
  type HighlighterCore,
  isSpecialLang,
} from '@shikijs/core'
import bash from '@shikijs/langs/bash'
import html from '@shikijs/langs/html'
import javascript from '@shikijs/langs/javascript'
import json from '@shikijs/langs/json'
import jsx from '@shikijs/langs/jsx'
import markdown from '@shikijs/langs/markdown'
import tsx from '@shikijs/langs/tsx'
import typescript from '@shikijs/langs/typescript'

import {createEngine} from '#/lib/shiki/engine'
import {getCodeThemeName, shikiThemes} from '#/lib/shiki/themes'
import {logger} from '#/logger'

export const shikiLangs = [
  javascript,
  typescript,
  tsx,
  jsx,
  json,
  bash,
  markdown,
  html,
]

/*
 * One highlighter for the whole app, loaded when the first code block mounts.
 * Until it is ready, or if it fails to load, code renders as plain text.
 */
let highlighter: HighlighterCore | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

async function load() {
  try {
    highlighter = await createHighlighterCore({
      langs: shikiLangs,
      themes: shikiThemes,
      engine: createEngine(),
    })
    for (const notify of listeners) notify()
  } catch (error) {
    logger.error('Failed to load code highlighter', {safeMessage: error})
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  loading ??= load()
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Highlighted lines of `code`, or null while the highlighter loads.
 */
export function useCodeTokens(
  code: string,
  lang: string | undefined,
  themeName: ThemeName,
) {
  const instance = useSyncExternalStore(subscribe, () => highlighter)
  if (!instance) return null
  return tokenizeCode(instance, code, {
    lang: lang || 'text',
    theme: getCodeThemeName(themeName),
  })
}

/**
 * Languages that aren't bundled render as plain text instead of throwing.
 */
export function tokenizeCode(
  instance: HighlighterCore,
  code: string,
  {lang, theme}: {lang: string; theme: string},
) {
  const isKnown =
    isSpecialLang(lang) || instance.getLoadedLanguages().includes(lang)
  return instance.codeToTokensBase(code, {
    lang: isKnown ? lang : 'text',
    theme,
  })
}
