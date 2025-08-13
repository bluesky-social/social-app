import React from 'react'
import {type StyleProp, type TextStyle, View} from 'react-native'
import * as Clipboard from 'expo-clipboard'

import {DEFAULT_THEME_NAME} from '#/lib/shiki/highlighter'
import {useHighlighter} from '#/lib/shiki/HighlighterContext'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function CodeBlockText({
  code,
  lang,
  textStyle,
}: {
  code: string
  lang?: string
  textStyle?: StyleProp<TextStyle>
}) {
  const {initialize, tokenize, isReady} = useHighlighter()
  const t = useTheme()
  const [expanded, setExpanded] = React.useState(false)
  const shouldCollapse = React.useMemo(() => {
    const approxLines = code.split('\n').length
    return approxLines > 20 || code.length > 8000
  }, [code])
  if (!isReady) {
    void initialize()
    return (
      <Text
        style={[
          a.rounded_sm,
          a.p_sm,
          a.bg_contrast_25,
          {fontFamily: 'Courier New'},
          textStyle,
        ]}>
        {code}
      </Text>
    )
  }
  const tokens = tokenize(code.replace(/\n$/, ''), {
    lang: lang && typeof lang === 'string' ? lang : 'text',
    theme: DEFAULT_THEME_NAME,
  })

  const containerStyles = [
    a.rounded_sm,
    a.border,
    t.atoms.border_contrast_low,
    t.atoms.bg_contrast_25,
    {
      maxHeight: !expanded && shouldCollapse ? 240 : undefined,
      overflow: 'hidden',
    },
  ]

  return (
    <Text>
      <View style={[a.w_full, a.my_md]}>
        <View style={containerStyles}>
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.items_center,
              a.px_sm,
              a.py_xs,
              {
                borderTopLeftRadius: a.rounded_sm.borderRadius,
                borderTopRightRadius: a.rounded_sm.borderRadius,
                backgroundColor: t.atoms.bg.backgroundColor,
              },
            ]}>
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {(lang || 'text').toLowerCase()}
            </Text>
            <Button
              label="Copy code"
              size="tiny"
              color="secondary"
              onPress={() => Clipboard.setStringAsync(code)}
              style={[a.px_sm, a.py_2xs, {borderRadius: 6}]}
              hoverStyle={undefined}>
              <ButtonText>Copy</ButtonText>
            </Button>
          </View>
          <View style={[a.border_b, t.atoms.border_contrast_low]} />
          <Text
            style={[
              a.p_md,
              a.leading_normal,
              {fontFamily: 'Courier New'},
              textStyle,
            ]}>
            {tokens.map((line, i) => (
              <Text key={`l-${i}`}>
                {line.map((tok, j) => (
                  <Text key={`t-${i}-${j}`} style={{color: tok.color}}>
                    {tok.content}
                  </Text>
                ))}
                {i < tokens.length - 1 ? '\n' : ''}
              </Text>
            ))}
          </Text>
        </View>
        {shouldCollapse ? (
          <View style={[a.mt_sm, a.self_end]}>
            <InlineLinkText
              to="#"
              onPress={e => {
                e.preventDefault?.()
                setExpanded(v => !v)
                return false
              }}>
              {expanded ? 'Show less' : 'Show more'}
            </InlineLinkText>
          </View>
        ) : null}
      </View>
    </Text>
  )
}
