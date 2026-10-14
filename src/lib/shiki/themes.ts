import {type ThemeName} from '@bsky.app/alf'
import {type ThemeRegistration} from '@shikijs/core'

import {themes} from '#/alf/themes'

export const DEFAULT_THEME_NAME = 'bluesky-dim'

/** Use the app's surfaces and a small set of readable semantic token colors. */
function createCodeTheme(name: ThemeName) {
  const theme = themes[name]
  const palette = theme.palette
  const foreground = theme.atoms.text.color
  const background = theme.atoms.bg_contrast_25.backgroundColor
  /** ALF's dark link shade also clears contrast on every code surface. */
  const primary = palette.primary_600
  const positive =
    name === 'light' ? palette.positive_700 : palette.positive_500

  return {
    name: `bluesky-${name}`,
    type: theme.scheme,
    fg: foreground,
    bg: background,
    colors: {
      'editor.foreground': foreground,
      'editor.background': background,
    },
    tokenColors: [
      {
        scope: [
          'keyword',
          'storage.type',
          'storage.modifier',
          'markup.heading',
        ],
        settings: {foreground: primary},
      },
      {
        scope: [
          'entity.name.function',
          'support.function',
          'variable.function',
        ],
        settings: {foreground: primary},
      },
      {
        scope: ['entity.name.tag', 'punctuation.definition.tag'],
        settings: {foreground: primary},
      },
      {
        scope: ['string', 'markup.inline.raw'],
        settings: {foreground: positive},
      },
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: {foreground: palette.contrast_600},
      },
      {
        scope: ['constant.numeric', 'constant.language', 'constant.character'],
        settings: {foreground: palette.contrast_700},
      },
    ],
  } satisfies ThemeRegistration
}

const codeThemes = {
  light: createCodeTheme('light'),
  dim: createCodeTheme('dim'),
  dark: createCodeTheme('dark'),
}

export const shikiThemes = Object.values(codeThemes)

/** Keep normal text, syntax colors, and the panel on the same app palette. */
export function getCodeTheme(name: ThemeName) {
  const theme = codeThemes[name]
  return {
    name: theme.name,
    backgroundColor: theme.bg,
    color: theme.fg,
  }
}
