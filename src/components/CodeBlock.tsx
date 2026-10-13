import {useEffect, useState} from 'react'
import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {useLingui} from '@lingui/react/macro'

import {useHighlighter} from '#/lib/shiki/HighlighterContext'
import {getCodeTheme} from '#/lib/shiki/themes'
import {atoms as a, MONOSPACE_FONT_FAMILY, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_ANDROID} from '#/env'

export function CodeBlock({
  code,
  displayCode = code,
  lang,
  textStyle,
  selectable = true,
}: {
  /** Reconstructed code payload for Copy, including its body line endings. */
  code: string
  displayCode?: string
  lang?: string
  textStyle?: StyleProp<TextStyle>
  selectable?: boolean
}) {
  const {initialize, tokenize, isReady} = useHighlighter()
  const {t: l} = useLingui()
  const t = useTheme()
  const codeTheme = getCodeTheme(t.name)
  const [expanded, setExpanded] = useState(false)
  const [copyLayout, setCopyLayout] = useState({width: 48, height: 28})
  const shouldCollapse =
    code.split(/\r\n|\r|\n/).length > 20 || code.length > 8000
  const visibleCode = displayCode.replace(/\r\n?/g, '\n').replace(/\n$/, '')
  const monospaceStyle = {
    fontFamily: MONOSPACE_FONT_FAMILY,
    color: codeTheme.color,
  }
  const contentStyle = [
    a.leading_normal,
    withoutCodeLayout(textStyle),
    monospaceStyle,
  ]

  useEffect(() => {
    void initialize().catch(() => {
      /* Source text and Copy remain usable when the engine cannot initialize. */
    })
  }, [initialize])

  const tokens = isReady
    ? tokenize(visibleCode, {lang: lang || 'text', theme: codeTheme.name})
    : null

  return (
    <View style={[a.w_full, a.my_sm]} testID="code-block">
      <View
        {...web({dataSet: {codeBlock: 1}})}
        style={[
          a.rounded_sm,
          a.border,
          t.atoms.border_contrast_low,
          {
            backgroundColor: codeTheme.backgroundColor,
            maxHeight: !expanded && shouldCollapse ? 240 : undefined,
            overflow: 'hidden',
          },
        ]}>
        <CodeCopyControl
          code={code}
          style={[a.absolute, {top: 8, right: 8, zIndex: 1}]}
          onLayout={({nativeEvent: {layout}}) => {
            setCopyLayout(current =>
              current.width === layout.width && current.height === layout.height
                ? current
                : {width: layout.width, height: layout.height},
            )
          }}
        />
        <Text
          emoji
          selectable={selectable}
          style={[
            a.p_sm,
            contentStyle,
            {
              minHeight: Math.max(44, copyLayout.height + 16),
              paddingRight: copyLayout.width + 16,
            },
          ]}>
          {tokens
            ? tokens.map((line, i) => (
                <Text
                  emoji
                  key={`l-${i}`}
                  selectable={selectable}
                  style={contentStyle}>
                  {line.map((token, j) => (
                    <Text
                      emoji
                      key={`t-${i}-${j}`}
                      selectable={selectable}
                      style={[
                        contentStyle,
                        {color: token.color || codeTheme.color},
                      ]}>
                      {token.content}
                    </Text>
                  ))}
                  {i < tokens.length - 1 ? '\n' : ''}
                </Text>
              ))
            : visibleCode}
        </Text>
      </View>
      {shouldCollapse ? (
        <View style={[a.mt_sm, a.self_end]}>
          <Button
            label={expanded ? l`Show less` : l`Show more`}
            size="tiny"
            color="secondary"
            onPress={event => {
              event.preventDefault()
              event.stopPropagation()
              setExpanded(v => !v)
            }}
            style={[a.px_sm, a.py_2xs, {borderRadius: 6}]}>
            <ButtonText>{expanded ? l`Show less` : l`Show more`}</ButtonText>
          </Button>
        </View>
      ) : null}
    </View>
  )
}

export function InlineCodeText({
  code,
  displayCode = code,
  textStyle,
  selectable,
}: {
  code: string
  displayCode?: string
  textStyle?: StyleProp<TextStyle>
  selectable?: boolean
}) {
  const t = useTheme()
  const [copyLayout, setCopyLayout] = useState({width: 48, height: 28})
  return (
    <Text
      {...web({dataSet: {codeInline: 1}})}
      testID="inline-code"
      emoji
      selectable={selectable}
      style={[
        a.rounded_sm,
        t.atoms.bg_contrast_25,
        withoutCodeLayout(textStyle),
        {fontFamily: MONOSPACE_FONT_FAMILY},
        web({
          display: 'inline-block',
          position: 'relative',
          minHeight: copyLayout.height,
          maxWidth: '100%',
          paddingRight: copyLayout.width + 8,
        }),
      ]}>
      {displayCode}
      <CodeCopyControl
        code={code}
        style={[
          web({position: 'absolute', top: 0, right: 0}),
          native({marginStart: 4}),
        ]}
        onLayout={({nativeEvent: {layout}}) => {
          setCopyLayout(current =>
            current.width === layout.width && current.height === layout.height
              ? current
              : {width: layout.width, height: layout.height},
          )
        }}
      />
    </Text>
  )
}

/** One clipboard action shared by floating panels and small inline attachments. */
function CodeCopyControl({
  code,
  style,
  onLayout,
}: {
  code: string
  style?: StyleProp<ViewStyle>
  onLayout?: ViewProps['onLayout']
}) {
  const {t: l} = useLingui()
  return (
    <View testID="code-copy-control" style={style} onLayout={onLayout}>
      <Button
        {...web({dataSet: {codeCopy: 1}})}
        label={l`Copy code`}
        size="tiny"
        color="secondary"
        hitSlop={8}
        onPress={async event => {
          event.preventDefault()
          event.stopPropagation()
          /* Expo's Android string bridge truncates at NUL; keep the clipboard. */
          const copied =
            !(IS_ANDROID && code.includes('\u0000')) &&
            (await Clipboard.setStringAsync(code).catch(() => false))
          Toast.show(copied ? l`Copied to clipboard` : l`Unable to copy code`, {
            type: copied ? 'success' : 'error',
          })
        }}
        style={[a.px_sm, a.py_2xs, {borderRadius: 6}]}
        testID="copy-code">
        <ButtonText>{l`Copy`}</ButtonText>
      </Button>
    </View>
  )
}

/** Text spans inherit typography, while their surrounding View owns layout. */
function withoutCodeLayout(textStyle: StyleProp<TextStyle>) {
  const style: TextStyle = {...StyleSheet.flatten(textStyle)}
  for (const property of [
    'flex',
    'flexBasis',
    'flexGrow',
    'flexShrink',
    'padding',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'paddingStart',
    'paddingEnd',
    'paddingHorizontal',
    'paddingVertical',
  ] as const) {
    delete style[property]
  }
  return style
}
