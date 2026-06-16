import {Platform, ScrollView, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {useThemeName} from '#/alf/util/useColorModeTheme'
import {Text} from '#/components/Typography'
import {highlightToLines, languageFromFilename} from './highlight'

const MONO_FONT = Platform.OS === 'android' ? 'monospace' : 'Courier New'
// Fixed per-line height so the vertical viewport cap (`maxHeightLines`) is exact.
const LINE_HEIGHT = 18
// Matches the vertical padding of the horizontal scroller's content container
// (a.py_sm, top + bottom), so a capped viewport shows whole lines.
const V_PADDING = 16

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

function colorForScope(
  scope: string | undefined,
  colors: Record<string, string>,
): string | undefined {
  if (!scope) return undefined
  return colors[scope] ?? colors[scope.split('.')[0]]
}

export function CodeBlock({
  code,
  filename,
  maxLines,
  maxHeightLines,
}: {
  code: string
  filename?: string
  /** Truncate the rendered code to this many lines (the card shows the rest). */
  maxLines?: number
  /**
   * Cap the rendered area to this many lines tall and scroll vertically within
   * it. When unset, the block grows to fit all rendered lines.
   */
  maxHeightLines?: number
}) {
  const t = useTheme()
  const themeName = useThemeName()
  const colors = themeName === 'light' ? LIGHT_COLORS : DARK_COLORS
  const codeBg = {backgroundColor: useCodePanelColor()}

  const language = languageFromFilename(filename)
  const allLines = highlightToLines(code, language)
  const lines = maxLines ? allLines.slice(0, maxLines) : allLines
  const gutterWidth = String(lines.length).length

  const content = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[a.py_sm, a.px_md]}>
      <View>
        {lines.map((line, idx) => (
          <View key={idx} style={[a.flex_row, {height: LINE_HEIGHT}]}>
            <Text
              selectable={false}
              style={[
                a.text_sm,
                t.atoms.text_contrast_low,
                {
                  fontFamily: MONO_FONT,
                  lineHeight: LINE_HEIGHT,
                  width: gutterWidth * 9 + 12,
                  textAlign: 'right',
                  paddingRight: 12,
                },
              ]}>
              {idx + 1}
            </Text>
            <Text
              style={[
                a.text_sm,
                t.atoms.text,
                {fontFamily: MONO_FONT, lineHeight: LINE_HEIGHT},
              ]}>
              {line.length === 0
                ? ' '
                : line.map((span, i) => (
                    <Text
                      key={i}
                      style={{color: colorForScope(span.scope, colors)}}>
                      {span.value}
                    </Text>
                  ))}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )

  if (maxHeightLines != null && lines.length > maxHeightLines) {
    return (
      <ScrollView
        style={[codeBg, {maxHeight: maxHeightLines * LINE_HEIGHT + V_PADDING}]}
        nestedScrollEnabled
        showsVerticalScrollIndicator>
        {content}
      </ScrollView>
    )
  }

  return <View style={[codeBg]}>{content}</View>
}
