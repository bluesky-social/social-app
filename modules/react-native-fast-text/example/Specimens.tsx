import {useEffect, useRef, useState} from 'react'
import {Text as RNText, type TextProps, View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

export type SpecimenPage = 'styles' | 'behavior'

/** Deterministic fixtures, shared by both renderers for pixel/layout comparisons. */
export function Specimens({
  Text,
  page,
  measurements,
}: {
  Text: React.ComponentType<
    TextProps & {ref?: React.Ref<React.ComponentRef<typeof RNText>>}
  >
  page: SpecimenPage
  measurements: Record<string, unknown>
}) {
  const [presses, setPresses] = useState(0)
  const name = 'Ada'
  const {i18n} = useLingui()
  const ref = useRef<React.ComponentRef<typeof RNText>>(null)
  useEffect(() => {
    measurements.refHasMeasure = typeof ref.current?.measure === 'function'
    measurements.locale = i18n.locale
  })

  const layout =
    (id: string): TextProps['onLayout'] =>
    event => {
      measurements[id] = event.nativeEvent.layout
    }

  if (page === 'behavior') {
    return (
      <View style={{gap: 14}}>
        <Text testID="translated" style={{fontSize: 18}}>
          <Trans id="benchmark.greeting">Hello, {name}!</Trans>
        </Text>
        <Text testID="scalar-update" style={{fontSize: 18}}>
          <Trans id="benchmark.counter">Hello, {presses}!</Trans>
        </Text>
        <Text testID="rich-translation" style={{fontSize: 18}}>
          <Trans id="benchmark.rich">
            Hello, <Text style={{fontWeight: '700'}}>Ada</Text>!
          </Trans>
        </Text>
        <Text testID="nested" style={{fontSize: 18}}>
          Normal <Text style={{fontWeight: '700'}}>bold</Text> normal
        </Text>
        <Text
          testID="pressed"
          accessibilityLabel="Increment text counter"
          accessibilityHint="Updates the counter and translated value"
          onPress={() => setPresses(presses + 1)}
          style={{fontSize: 18, color: '#006aff'}}>
          Pressed {presses} times
        </Text>
        <Text
          testID="locale-switch"
          accessibilityLabel="Switch text language"
          accessibilityHint="Toggles English and French"
          onPress={() => {
            measurements.localePresses =
              Number(measurements.localePresses ?? 0) + 1
            i18n.activate(i18n.locale === 'en' ? 'fr' : 'en')
          }}
          style={{fontSize: 18, color: '#006aff'}}>
          Switch language
        </Text>
        <Text testID="selectable" selectable style={{fontSize: 18}}>
          Selectable <Text style={{fontWeight: '700'}}>nested bold</Text> text.
        </Text>
        <Text testID="imperative-ref" ref={ref} style={{fontSize: 18}}>
          Native ref remains available.
        </Text>
        <Text
          testID="text-layout"
          onTextLayout={event => {
            measurements.textLayoutLines = event.nativeEvent.lines.length
          }}
          style={{fontSize: 18}}>
          Text layout callback remains available.
        </Text>
        <Text testID="unknown-component" style={{fontSize: 18}}>
          <HookChild />
        </Text>
      </View>
    )
  }

  return (
    <View style={{gap: 8}}>
      <Text testID="default" onLayout={layout('default')}>
        Default text Aa gy
      </Text>
      <Text
        testID="normal"
        onLayout={layout('normal')}
        style={{fontSize: 16, lineHeight: 22, color: '#111827'}}>
        Hello, person 42!
      </Text>
      <Text
        testID="compact"
        onLayout={layout('compact')}
        style={{fontSize: 18, lineHeight: 14}}>
        Compact line height: Ågjpq
      </Text>
      <Text
        testID="inter"
        onLayout={layout('inter')}
        style={{
          fontFamily: 'InterVariable',
          fontSize: 18,
          lineHeight: 24,
          fontWeight: '600',
          fontVariant: ['no-contextual'],
        }}>
        Inter: Hello 123 Ågjpq
      </Text>
      <Text
        testID="wrapped"
        onLayout={layout('wrapped')}
        style={{fontSize: 16, lineHeight: 22}}>
        Wrapped paragraph: the quick brown fox jumps over the lazy dog. A second
        sentence with punctuation, a comma, and words.
      </Text>
      <Text
        testID="ellipsis"
        onLayout={layout('ellipsis')}
        numberOfLines={1}
        style={{fontSize: 16, lineHeight: 22}}>
        Truncated paragraph: the quick brown fox jumps over the lazy dog.
      </Text>
      <Text
        testID="padded"
        onLayout={layout('padded')}
        style={{
          fontSize: 16,
          lineHeight: 22,
          padding: 8,
          borderWidth: 1,
          borderColor: '#cbd5e1',
          borderRadius: 5,
          backgroundColor: '#eff6ff',
        }}>
        Padded label with border
      </Text>
      <Text
        testID="rtl"
        onLayout={layout('rtl')}
        style={{fontSize: 18, lineHeight: 24, writingDirection: 'rtl'}}>
        مرحبا بالعالم 123
      </Text>
      <Text
        testID="emoji"
        onLayout={layout('emoji')}
        style={{fontSize: 18, lineHeight: 24}}>
        Hello 👋 🦋 👨‍👩‍👧‍👦 🇫🇮 é
      </Text>
      <Text
        testID="decoration"
        onLayout={layout('decoration')}
        style={{
          fontSize: 18,
          color: '#2563eb',
          textDecorationLine: 'underline',
          letterSpacing: 0.25,
        }}>
        Underlined and letter spaced
      </Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        <RNText style={{fontSize: 12}}>Baseline </RNText>
        <Text
          testID="baseline"
          onLayout={layout('baseline')}
          style={{fontSize: 26}}>
          Align me
        </Text>
        <RNText style={{fontSize: 12}}> suffix</RNText>
      </View>
      <View style={{backgroundColor: '#fef3c7'}}>
        <Text testID="empty" onLayout={layout('empty')}>
          {''}
        </Text>
      </View>
    </View>
  )
}

function HookChild() {
  const [value] = useState('Arbitrary hook components still render.')
  return <>{value}</>
}
