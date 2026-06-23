/**
 * Renders Markdown-style code in post text: inline `code` and fenced
 * ```lang\n...``` blocks.
 *
 * Inline code and (in truncated previews) fenced code stay inside the parent
 * RichText `<Text>`. In full post views a fenced block renders as a `<View>`
 * panel - a rounded rectangle behind the whole block - which RichText splices
 * between prose `<Text>` runs (a `<View>` cannot live inside a `<Text>`). See
 * `parseCodeParts` for how that block/inline split is surfaced to RichText, and
 * `#/lib/code/parse` for the tokenizer.
 *
 * Opt-in: only used when RichText is given `enableCode` (post bodies).
 */
import {type ReactNode} from 'react'
import {View} from 'react-native'

import {highlightToLines, languageFromName} from '#/lib/code/highlight'
import {parseCodeTokens} from '#/lib/code/parse'
import {
  CODE_LINE_HEIGHT,
  colorForScope,
  MONO_FONT,
  useCodeColors,
  useCodePanelColor,
} from '#/lib/code/theme'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/** A part of a text run: either inline (lives in a `<Text>`) or a block. */
export type CodePart = {block: boolean; node: ReactNode}

function InlineCode({value}: {value: string}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.rounded_xs,
        {
          fontFamily: MONO_FONT,
          backgroundColor: t.atoms.bg_contrast_50.backgroundColor,
          paddingHorizontal: 3,
        },
      ]}>
      {value}
    </Text>
  )
}

/** Renders highlighted lines as nested colored `<Text>` (newline-separated). */
function HighlightedLines({value, lang}: {value: string; lang?: string}) {
  const colors = useCodeColors()
  const lines = highlightToLines(value, languageFromName(lang))
  return (
    <>
      {lines.map((line, i) => (
        // Each nested Text re-applies a font family, so set MONO_FONT on every
        // level - otherwise the inner spans revert to the Inter UI font.
        <Text key={i} style={{fontFamily: MONO_FONT}}>
          {line.length === 0
            ? ' '
            : line.map((span, j) => (
                <Text
                  key={j}
                  style={{
                    color: colorForScope(span.scope, colors),
                    fontFamily: MONO_FONT,
                  }}>
                  {span.value}
                </Text>
              ))}
          {i < lines.length - 1 ? '\n' : null}
        </Text>
      ))}
    </>
  )
}

/**
 * Inline fenced code - stays in the text flow (so it respects `numberOfLines`),
 * but the background hugs each line. Used in truncated previews.
 */
function FencedCodeInline({value, lang}: {value: string; lang?: string}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.rounded_xs,
        {
          fontFamily: MONO_FONT,
          backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
        },
      ]}>
      {'\n'}
      <HighlightedLines value={value} lang={lang} />
      {'\n'}
    </Text>
  )
}

/**
 * Block fenced code - a rounded rectangle panel behind the whole block. Used in
 * full post views. Long lines wrap (no horizontal scroll, no line numbers).
 */
function FencedCodeBlock({value, lang}: {value: string; lang?: string}) {
  const t = useTheme()
  const bg = useCodePanelColor()
  return (
    <View
      style={[a.rounded_sm, a.px_md, a.py_sm, a.my_xs, {backgroundColor: bg}]}>
      <Text
        style={[
          a.text_sm,
          t.atoms.text,
          {fontFamily: MONO_FONT, lineHeight: CODE_LINE_HEIGHT},
        ]}>
        <HighlightedLines value={value} lang={lang} />
      </Text>
    </View>
  )
}

/**
 * Splits a run of post text into parts. `blockMode` renders fenced blocks as
 * `<View>` panels (full views); otherwise they stay inline (truncated previews,
 * where a block View would break `numberOfLines`). `keyPrefix` keeps element
 * keys unique across a post's multiple text runs.
 *
 * Limitation: this runs per RichText segment, and `richText.segments()` splits
 * at facet boundaries - so a fenced block whose body contains a link/mention
 * (e.g. a URL) has its ``` delimiters land in different segments than the body
 * and renders literally rather than as a code block. Rare in practice;
 * detecting it would require parsing code regions before facet segmentation.
 */
export function parseCodeParts(
  text: string,
  keyPrefix: string,
  blockMode: boolean,
): CodePart[] {
  const tokens = parseCodeTokens(text)
  // Block panels carry their own vertical margin (a.my_xs). Trim a single
  // newline from text adjacent to a block so an author's blank line around the
  // fence doesn't double the gap. Safe to mutate: tokens are freshly created.
  if (blockMode) {
    tokens.forEach((tok, i) => {
      if (tok.type !== 'fence') return
      const prev = tokens[i - 1]
      if (prev?.type === 'text') prev.value = prev.value.replace(/\n$/, '')
      const next = tokens[i + 1]
      if (next?.type === 'text') next.value = next.value.replace(/^\n/, '')
    })
  }
  return tokens.map((tok, i): CodePart => {
    if (tok.type === 'text') return {block: false, node: tok.value}
    const key = `${keyPrefix}:${i}`
    if (tok.type === 'inline') {
      // Inline code renders verbatim (not highlighted), so strip any stray CR.
      const value = tok.value.replace(/\r/g, '')
      return {block: false, node: <InlineCode key={key} value={value} />}
    }
    if (blockMode) {
      return {
        block: true,
        node: <FencedCodeBlock key={key} value={tok.value} lang={tok.lang} />,
      }
    }
    return {
      block: false,
      node: <FencedCodeInline key={key} value={tok.value} lang={tok.lang} />,
    }
  })
}
