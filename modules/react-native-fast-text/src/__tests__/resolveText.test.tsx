import {Fragment as FragmentText} from 'react'
import {Text, type TextStyle} from 'react-native'
import {setupI18n} from '@lingui/core'
import {type I18nContext, Trans} from '@lingui/react'

import {NEEDS_TRANSLATION, resolveText, UNSUPPORTED} from '../resolveText'
import {supportsProps, supportsStyle} from '../supported'

function context(messages: Record<string, string> = {}): I18nContext {
  const i18n = setupI18n({locale: 'en', messages: {en: messages}})
  return {i18n, _: i18n._.bind(i18n)}
}

describe('safe text lowering', () => {
  it('joins primitive arrays and transparent fragments', () => {
    expect(
      resolveText([
        'a',
        [1, null, false, <FragmentText key="f">b{2n}</FragmentText>],
      ]),
    ).toBe('a1b2')
    expect(resolveText(undefined)).toBe('')
    expect(resolveText(true)).toBe('')
  })

  it('resolves only the real Lingui Trans, with scalar values', () => {
    const lingui = context({hello: 'Hello, {name}!'})
    const child = <Trans id="hello" values={{name: 'Ada'}} />
    expect(resolveText(child)).toBe(NEEDS_TRANSLATION)
    expect(resolveText(child, lingui)).toBe('Hello, Ada!')
    lingui.i18n.loadAndActivate({
      locale: 'fr',
      messages: {hello: 'Salut, {name}!'},
    })
    expect(resolveText(child, lingui)).toBe('Salut, Ada!')
  })

  it('supports translated plurals and fallback messages', () => {
    const lingui = context()
    expect(resolveText(<Trans id="missing" message="Hello" />, lingui)).toBe(
      'Hello',
    )
    expect(
      resolveText(
        <Trans
          id="items"
          message="{count, plural, one {# item} other {# items}}"
          values={{count: 3}}
        />,
        lingui,
      ),
    ).toBe('3 items')
  })

  it('does not execute unknown components or lower styled descendants', () => {
    const Unknown = jest.fn(() => 'unknown')
    expect(resolveText(<Unknown />)).toBe(UNSUPPORTED)
    expect(Unknown).not.toHaveBeenCalled()
    expect(
      resolveText(
        <>
          Hello <Text style={{fontWeight: 'bold'}}>Ada</Text>
        </>,
      ),
    ).toBe(UNSUPPORTED)
    expect(resolveText(new Set(['a', 'b']) as unknown as React.ReactNode)).toBe(
      UNSUPPORTED,
    )
  })

  it('preserves Lingui component interpolation and custom renderers', () => {
    const lingui = context({greeting: '<0>Hello</0>'})
    expect(
      resolveText(<Trans id="greeting" components={{0: <Text />}} />, lingui),
    ).toBe(UNSUPPORTED)
    expect(
      resolveText(
        <Trans id="greeting" values={{name: <Text>Ada</Text>}} />,
        lingui,
      ),
    ).toBe(UNSUPPORTED)
    expect(resolveText(<Trans id="hello" component={Text} />, lingui)).toBe(
      UNSUPPORTED,
    )
    expect(resolveText(<Trans id="hello" render={() => <></>} />, lingui)).toBe(
      UNSUPPORTED,
    )
    expect(resolveText(<Trans id="greeting" />, lingui)).toBe(UNSUPPORTED)
    expect(
      resolveText(<Trans id="hello" />, {...lingui, defaultComponent: Text}),
    ).toBe(UNSUPPORTED)
  })

  it('validates a whole child tree before translating', () => {
    const translate = jest.spyOn(context().i18n, '_')
    expect(
      resolveText([<Trans key="t" id="hello" />, <Text key="b">bold</Text>]),
    ).toBe(UNSUPPORTED)
    expect(translate).not.toHaveBeenCalled()
  })

  it('bounds recursion', () => {
    let children: React.ReactNode = 'end'
    for (let i = 0; i < 70; i++) children = [children]
    expect(resolveText(children)).toBe(UNSUPPORTED)
  })
})

describe('compatibility routing', () => {
  const ignored = new Set<string>()
  it('accepts ordinary labels', () => {
    expect(
      supportsProps(
        {children: 'Hi', numberOfLines: 1, selectable: false},
        ignored,
      ),
    ).toBe(true)
    expect(
      supportsStyle({fontSize: 16, lineHeight: 22, fontWeight: '600'}),
    ).toBe(true)
  })
  it.each([
    {onPress: () => {}},
    {onTextLayout: () => {}},
    {selectable: true},
    {adjustsFontSizeToFit: true},
    {ref: {current: null}},
    {unknownFutureProp: true},
  ])('preserves unsupported behavior: %p', props => {
    expect(supportsProps(props, ignored)).toBe(false)
  })
  it('rejects style features with different semantics', () => {
    expect(supportsStyle({textTransform: 'capitalize'})).toBe(false)
    expect(supportsStyle({textDecorationStyle: 'dashed'})).toBe(false)
    expect(supportsStyle({fontWeight: 450 as TextStyle['fontWeight']})).toBe(
      false,
    )
  })
  it('only ignores explicitly declared adapter props', () => {
    const props = {children: 'Hi', uiTextView: true}
    expect(supportsProps(props, ignored)).toBe(false)
    expect(supportsProps(props, new Set(['uiTextView']))).toBe(true)
  })
})
