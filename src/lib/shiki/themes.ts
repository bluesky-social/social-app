import {type ThemeName} from '@bsky.app/alf'
import {type ThemeRegistration} from '@shikijs/core'

import {themes} from '#/alf/themes'

export function getCodeThemeName(name: ThemeName) {
  return `bluesky-${name}`
}

/**
 * Syntax colors from the app palette, on the code panel's surface. Every token
 * color clears 4.5:1 contrast against that surface.
 */
function createCodeTheme(name: ThemeName) {
  const {palette, atoms, scheme} = themes[name]
  return {
    name: getCodeThemeName(name),
    type: scheme,
    fg: atoms.text.color,
    bg: atoms.bg_contrast_25.backgroundColor,
    tokenColors: [
      {
        scope: [
          'keyword',
          'storage.type',
          'storage.modifier',
          'markup.heading',
          'entity.name.function',
          'support.function',
          'variable.function',
          'entity.name.tag',
          'punctuation.definition.tag',
        ],
        settings: {foreground: palette.primary_600},
      },
      {
        scope: ['string', 'markup.inline.raw'],
        settings: {
          foreground:
            name === 'light' ? palette.positive_700 : palette.positive_500,
        },
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

export const shikiThemes = [
  createCodeTheme('light'),
  createCodeTheme('dim'),
  createCodeTheme('dark'),
]
