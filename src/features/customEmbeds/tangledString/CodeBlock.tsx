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

// Vertical padding of the code area (a.py_sm, top + bottom), used to size the
// capped viewport. Approximate once lines wrap (see maxHeightLines).
const V_PADDING = 16

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
   * it. When unset, the block grows to fit all rendered lines. Approximate once
   * lines wrap - a wrapped line is taller than one `LINE_HEIGHT`.
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
              a.flex_1,
              t.atoms.text,
              {fontFamily: MONO_FONT, lineHeight: LINE_HEIGHT},
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
