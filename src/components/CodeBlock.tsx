import {View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {useLingui} from '@lingui/react/macro'

import {useCodeTokens} from '#/lib/shiki'
import {
  atoms as a,
  MONOSPACE_FONT_FAMILY,
  type TextStyleProp,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

/**
 * A fenced code block with syntax highlighting and a Copy button. `style` is
 * the surrounding post text's style, so code matches its size.
 */
export function CodeBlock({
  code,
  lang,
  style,
  selectable,
}: TextStyleProp & {
  code: string
  lang?: string
  selectable?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  /** One line ending, so the plain-text fallback matches Shiki's lines. */
  const displayCode = code.replace(/\r\n?/g, '\n')
  const tokens = useCodeTokens(displayCode, lang, t.name)
  /** Nested Text resets to the default text style, so every span repeats it. */
  const codeStyle = [
    style,
    a.leading_normal,
    {fontFamily: MONOSPACE_FONT_FAMILY},
  ]

  return (
    <View
      {...web({dataSet: {codeBlock: 1}})}
      testID="codeBlock"
      style={[
        a.flex_row,
        a.align_start,
        a.my_sm,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <Text emoji selectable={selectable} style={[codeStyle, a.flex_1, a.p_sm]}>
        {tokens
          ? tokens.map((line, i) => (
              <Text key={i} emoji selectable={selectable} style={codeStyle}>
                {line.map((token, j) => (
                  <Text
                    key={j}
                    emoji
                    selectable={selectable}
                    style={[codeStyle, {color: token.color}]}>
                    {token.content}
                  </Text>
                ))}
                {i < tokens.length - 1 ? '\n' : null}
              </Text>
            ))
          : displayCode}
      </Text>
      <Button
        {...web({dataSet: {codeCopy: 1}})}
        label={l`Copy code`}
        size="tiny"
        color="secondary"
        style={[a.m_sm]}
        onPress={event => {
          // Keep the press from also opening the post.
          event.preventDefault()
          event.stopPropagation()
          void Clipboard.setStringAsync(code)
          Toast.show(l`Copied to clipboard`, {type: 'success'})
        }}>
        <ButtonText>{l`Copy`}</ButtonText>
      </Button>
    </View>
  )
}

/**
 * An inline code span, rendered inside the surrounding post text.
 */
export function InlineCode({
  code,
  style,
  selectable,
}: TextStyleProp & {
  code: string
  selectable?: boolean
}) {
  const t = useTheme()
  return (
    <Text
      emoji
      selectable={selectable}
      style={[
        style,
        a.rounded_xs,
        t.atoms.bg_contrast_25,
        {fontFamily: MONOSPACE_FONT_FAMILY},
        web({paddingLeft: 3, paddingRight: 3}),
      ]}>
      {code}
    </Text>
  )
}
