import {ScrollView, View} from 'react-native'

import {highlightToLines, languageFromFilename} from '#/lib/code/highlight'
import {
  CODE_LINE_HEIGHT as LINE_HEIGHT,
  colorForScope,
  MONO_FONT,
  useCodeColors,
  useCodePanelColor,
} from '#/lib/code/theme'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

// a.py_sm padding above and below the rendered code (8px each). Used to size the
// capped/clipped viewports so they land on a whole row boundary.
const PADDING_Y = 8

// Web: lets long unbreakable tokens (e.g. a run of dashes) break instead of
// forcing the line wider than the card - which otherwise compresses the gutter
// and shoves the line number left. Maps to `word-break: break-word` via the
// global `*[data-word-wrap]` rule in src/style.css. No-op on native (RN breaks
// long words by default).
const WORD_WRAP = {wordWrap: 1}

export function CodeBlock({
  code,
  filename,
  maxLines,
  maxHeightLines,
}: {
  code: string
  filename?: string
  /**
   * Collapsed preview: render at most this many logical lines AND clip the area
   * to this many rows tall. The pixel clip matters because lines wrap - a single
   * long line can wrap to many rows, so a logical-line slice alone can't bound
   * the height. The parent's "Show more" reveals the rest.
   */
  maxLines?: number
  /**
   * Expanded: cap the area to this many rows tall and scroll vertically within
   * it. When unset, the block grows to fit all rendered lines. Capped by pixels,
   * so wrapped (taller) lines are bounded too.
   */
  maxHeightLines?: number
}) {
  const t = useTheme()
  const colors = useCodeColors()
  const codeBg = {backgroundColor: useCodePanelColor()}

  const language = languageFromFilename(filename)
  const allLines = highlightToLines(code, language)
  const lines = maxLines ? allLines.slice(0, maxLines) : allLines
  const gutterWidth = String(lines.length).length

  // Long lines wrap to the card width rather than scrolling horizontally - a
  // nested horizontal scroll reads poorly inside the vertically-scrolling feed.
  // The line number aligns to the first visual row of each wrapped line.
  const content = (
    <View style={[a.py_sm, a.px_md]}>
      {lines.map((line, idx) => (
        <View
          key={idx}
          style={[a.flex_row, a.align_start, {minHeight: LINE_HEIGHT}]}>
          <Text
            selectable={false}
            style={[
              a.text_sm,
              t.atoms.text_contrast_low,
              {
                // Fixed gutter: never let a long code line compress it (which
                // would slide the right-aligned number left).
                flexShrink: 0,
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
            // @ts-ignore web only -prf
            dataSet={WORD_WRAP}
            style={[
              a.text_sm,
              a.flex_1,
              t.atoms.text,
              // minWidth: 0 lets the flex child shrink below its content's
              // intrinsic width so long tokens wrap instead of overflowing.
              {fontFamily: MONO_FONT, lineHeight: LINE_HEIGHT, minWidth: 0},
            ]}>
            {line.length === 0
              ? ' '
              : line.map((span, i) => (
                  // The parent Text sets MONO_FONT, but each nested Text
                  // re-applies a font family, so repeat it here or the span
                  // reverts to the Inter UI font.
                  <Text
                    key={i}
                    style={{
                      color: colorForScope(span.scope, colors),
                      fontFamily: MONO_FONT,
                    }}>
                    {span.value}
                  </Text>
                ))}
          </Text>
        </View>
      ))}
    </View>
  )

  // Expanded: cap height by pixels and scroll within it. (Capping by logical
  // line count is wrong once lines wrap.)
  if (maxHeightLines != null) {
    return (
      <ScrollView
        style={[
          codeBg,
          {maxHeight: maxHeightLines * LINE_HEIGHT + PADDING_Y * 2},
        ]}
        nestedScrollEnabled
        showsVerticalScrollIndicator>
        {content}
      </ScrollView>
    )
  }

  // Collapsed preview: clip to exactly maxLines rows. A logical-line slice can't
  // bound the height once a line wraps, so clip by pixels - and include only the
  // top padding (not bottom) so the clip lands on a row boundary instead of
  // slicing the next row in half. The parent's "Show more" reveals the rest.
  if (maxLines != null) {
    return (
      <View
        style={[
          codeBg,
          a.overflow_hidden,
          {maxHeight: maxLines * LINE_HEIGHT + PADDING_Y},
        ]}>
        {content}
      </View>
    )
  }

  return <View style={[codeBg]}>{content}</View>
}
