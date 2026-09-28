import {createRef, useState} from 'react'
import {
  Platform,
  Text as RNText,
  unstable_TextAncestorContext as TextAncestorContext,
} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider, Trans} from '@lingui/react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import {createText, createTextRenderer, Text} from '../index'

jest.mock('react-native-plain-text', () => {
  const actual = jest.requireActual('react-native-plain-text')
  return {...actual, unstable_NativePlainText: 'RNPlainText'}
})

function lingui() {
  return setupI18n({
    locale: 'en',
    messages: {
      en: {greeting: 'Hello, {name}!'},
      fr: {greeting: 'Bonjour, {name} !'},
    },
  })
}

describe('Text routing and updates', () => {
  it('keeps the RN renderer and props on Android, while lowering safe content', () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      const onPress = jest.fn()
      const i18n = lingui()
      const tree = () => (
        <I18nProvider i18n={i18n}>
          <Text
            testID="android"
            onPress={onPress}
            numberOfLines={1}
            ellipsizeMode="head"
            style={{textAlign: 'right'}}>
            <Trans id="greeting" values={{name: 'Ada'}} />
          </Text>
        </I18nProvider>
      )
      render(tree())
      expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
      expect(screen.UNSAFE_queryAllByType(Trans)).toHaveLength(0)
      expect(screen.getByTestId('android').props).toMatchObject({
        numberOfLines: 1,
        ellipsizeMode: 'head',
        style: {textAlign: 'right'},
      })
      fireEvent.press(screen.getByTestId('android'))
      expect(onPress).toHaveBeenCalledTimes(1)
      act(() => i18n.activate('fr'))
      expect(screen.getByText('Bonjour, Ada !')).toBeTruthy()
      screen.rerender(
        <I18nProvider i18n={i18n}>
          <Text>
            <>Hello, {'Ada'}!</>
          </Text>
        </I18nProvider>,
      )
      expect(screen.getByText('Hello, Ada!')).toBeTruthy()
      screen.rerender(
        <I18nProvider i18n={i18n}>
          <Text deopt>
            <Trans id="greeting" values={{name: 'Ada'}} />
          </Text>
        </I18nProvider>,
      )
      expect(screen.UNSAFE_queryAllByType(Trans)).toHaveLength(1)
    } finally {
      platform.restore()
    }
  })

  it('renders primitives through one native label with RN-compatible defaults', () => {
    render(
      <Text testID="label" style={{fontSize: 16}}>
        Hello{42}
      </Text>,
    )
    expect(screen.toJSON()).toMatchObject({
      type: 'RNPlainText',
      props: {
        text: 'Hello42',
        fontSize: 16,
        accessible: true,
        accessibilityLabel: 'Hello42',
        lineHeightClippingCompat: true,
      },
    })
  })

  it('subscribes to locale changes and interpolated prop updates', () => {
    const i18n = lingui()
    const tree = (name: string) => (
      <I18nProvider i18n={i18n}>
        <Text>
          <Trans id="greeting" values={{name}} />
        </Text>
      </I18nProvider>
    )
    render(tree('Ada'))
    expect(screen.toJSON()).toMatchObject({
      type: 'RNPlainText',
      props: {text: 'Hello, Ada!'},
    })
    act(() => i18n.activate('fr'))
    expect(screen.toJSON()).toMatchObject({
      type: 'RNPlainText',
      props: {text: 'Bonjour, Ada !'},
    })
    screen.rerender(tree('Grace'))
    expect(screen.toJSON()).toMatchObject({props: {text: 'Bonjour, Grace !'}})
  })

  it('preserves interactive fallback and its children', () => {
    const onPress = jest.fn()
    render(
      <Text onPress={onPress} testID="button">
        Press me
      </Text>,
    )
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
    fireEvent.press(screen.getByTestId('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not remove hook-based arbitrary children', () => {
    function Child() {
      const [name] = useState('Ada')
      return <>{name}</>
    }
    render(
      <Text>
        Hello <Child />
      </Text>,
    )
    expect(screen.getByText('Hello Ada')).toBeTruthy()
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
  })

  it('preserves native refs and empty-content behavior through fallback', () => {
    const ref = createRef<React.ComponentRef<typeof RNText>>()
    render(<Text ref={ref}>Ref text</Text>)
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
    screen.rerender(<Text>{null}</Text>)
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
    screen.rerender(<Text>{''}</Text>)
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
  })

  it('never mounts a standalone label inside an RN text ancestor', () => {
    render(
      <TextAncestorContext value={true}>
        <Text>Nested</Text>
      </TextAncestorContext>,
    )
    expect(screen.toJSON()).not.toMatchObject({type: 'RNPlainText'})
  })

  it('guards custom fallback descendants across independently created adapters', () => {
    function Custom({children}: {children?: React.ReactNode}) {
      return <RNText>{children}</RNText>
    }
    const Parent = createText(Custom)
    const ChildText = createText(Custom)
    render(
      <Parent deopt>
        <ChildText>Nested</ChildText>
      </Parent>,
    )
    expect(JSON.stringify(screen.toJSON())).not.toContain('RNPlainText')
    expect(screen.getByText('Nested')).toBeTruthy()
  })

  it('preserves a provider defaultComponent', () => {
    function Default({children}: {children?: React.ReactNode}) {
      return <RNText testID="default-component">{children}</RNText>
    }
    render(
      <I18nProvider i18n={lingui()} defaultComponent={Default}>
        <Text>
          <Trans id="greeting" values={{name: 'Ada'}} />
        </Text>
      </I18nProvider>,
    )
    expect(screen.getByTestId('default-component')).toBeTruthy()
    expect(JSON.stringify(screen.toJSON())).not.toContain('RNPlainText')
  })

  it('allows conditional React 19 context reads as content changes', () => {
    const i18n = lingui()
    const useText = createTextRenderer(RNText)
    function Wrapper({children}: {children: React.ReactNode}) {
      return useText({children})
    }
    const tree = (children: React.ReactNode) => (
      <I18nProvider i18n={i18n}>
        <Wrapper>{children}</Wrapper>
      </I18nProvider>
    )
    render(tree('plain'))
    screen.rerender(tree(<Trans id="greeting" values={{name: 'Ada'}} />))
    expect(screen.toJSON()).toMatchObject({props: {text: 'Hello, Ada!'}})
    screen.rerender(tree(<RNText>rich</RNText>))
    expect(screen.getByText('rich')).toBeTruthy()
    screen.rerender(tree('plain again'))
    expect(screen.toJSON()).toMatchObject({props: {text: 'plain again'}})
  })
})
