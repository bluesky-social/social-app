import {type HighlighterCore, isSpecialLang} from '@shikijs/core'

/**
 * Render unbundled language tags as plain text without changing registered
 * aliases or Shiki's special language modes.
 */
export function tokenizeCode(
  highlighter: HighlighterCore,
  code: string,
  options: {lang: string; theme: string},
) {
  const lang =
    isSpecialLang(options.lang) ||
    highlighter.getLoadedLanguages().includes(options.lang)
      ? options.lang
      : 'text'

  return highlighter.codeToTokensBase(code, {...options, lang})
}
