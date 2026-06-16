/**
 * Shared theming for rendered code: monospace font, GitHub-style token palettes
 * keyed by highlight.js scope, and the embed panel background. Used by the
 * tangled string embed's `CodeBlock` and by inline/fenced code in post text.
 */
import {MONOSPACE_FONT_FAMILY} from '#/alf/fonts'
import {useThemeName} from '#/alf/util/useColorModeTheme'

/**
 * Monospace family for rendered code. Re-exported from ALF so it stays the
 * exact constant `applyFonts` checks against (otherwise the Inter UI font would
 * override it). See src/alf/fonts.ts.
 */
export const MONO_FONT = MONOSPACE_FONT_FAMILY

// Fixed per-line height for rendered code. CodeBlock also relies on it being
// exact for its vertical viewport cap (`maxHeightLines`).
export const CODE_LINE_HEIGHT = 18

// Panel background for the whole embed (header, code, footer share it) so the
// card reads as one surface offset from the page. `bg_contrast_25` goes the
// wrong way in dark themes (lighter than bg), so we set these explicitly.
const PANEL_BG: Record<string, string> = {
  light: '#EDEBE5', // a touch darker than the off-white base
  dim: '#101010', // darker than the dim #1A1A1A base
  dark: '#141414', // dark base is pure black, so go a touch lighter instead
}

/** Shared panel color for the embed card and its code area. */
export function useCodePanelColor(): string {
  const themeName = useThemeName()
  return PANEL_BG[themeName] ?? PANEL_BG.dark
}

// GitHub-style token palettes keyed by highlight.js scope. Scopes not listed
// (operators, punctuation, params, ...) inherit the base text color, which
// reads best as plain code. Lookups fall back from the full scope (e.g.
// `title.function_`) to its first segment (`title`).
const DARK_COLORS: Record<string, string> = {
  keyword: '#ff7b72',
  built_in: '#ffa657',
  type: '#ff7b72',
  literal: '#79c0ff',
  number: '#79c0ff',
  string: '#a5d6ff',
  regexp: '#a5d6ff',
  comment: '#8b949e',
  meta: '#8b949e',
  title: '#d2a8ff',
  'title.function_': '#d2a8ff',
  'title.class_': '#ffa657',
  attr: '#79c0ff',
  attribute: '#79c0ff',
  property: '#79c0ff',
  variable: '#ffa657',
  symbol: '#79c0ff',
  tag: '#7ee787',
  name: '#7ee787',
  'selector-tag': '#7ee787',
}
const LIGHT_COLORS: Record<string, string> = {
  keyword: '#cf222e',
  built_in: '#953800',
  type: '#cf222e',
  literal: '#0550ae',
  number: '#0550ae',
  string: '#0a3069',
  regexp: '#0a3069',
  comment: '#6e7781',
  meta: '#6e7781',
  title: '#8250df',
  'title.function_': '#8250df',
  'title.class_': '#953800',
  attr: '#0550ae',
  attribute: '#0550ae',
  property: '#0550ae',
  variable: '#953800',
  symbol: '#0550ae',
  tag: '#116329',
  name: '#116329',
  'selector-tag': '#116329',
}

/** Returns the token palette for the active theme (light vs dark/dim). */
export function useCodeColors(): Record<string, string> {
  const themeName = useThemeName()
  return themeName === 'light' ? LIGHT_COLORS : DARK_COLORS
}

export function colorForScope(
  scope: string | undefined,
  colors: Record<string, string>,
): string | undefined {
  if (!scope) return undefined
  return colors[scope] ?? colors[scope.split('.')[0]]
}
