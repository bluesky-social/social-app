import {StyleSheet, Text, type TextStyle, View} from 'react-native'
import {
  type Facet,
  RichText as RichTextAPI,
  UnicodeString,
} from '@bsky/sdk/richtext'
import {render} from '@testing-library/react-native'

import {CodeBlock, InlineCodeText} from '#/components/CodeBlock'
import {InlineLinkText} from '#/components/Link'
import {PostBody} from '#/components/Post/PostBody'
import {RichText} from '#/components/RichText'

jest.mock('#/alf', () => ({
  atoms: {text_sm: {fontSize: 14}, w_full: {width: '100%'}},
  flatten:
    jest.requireActual<typeof import('react-native')>('react-native').StyleSheet
      .flatten,
  android: (style: TextStyle) => style,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Link', () => {
  const {Text} = jest.requireActual('react-native')
  return {
    InlineLinkText: ({children, ...props}: {children: React.ReactNode}) => (
      <Text accessibilityRole="link" {...props}>
        {children}
      </Text>
    ),
  }
})
jest.mock('#/components/ProfileHoverCard', () => ({
  ProfileHoverCard: ({children}: {children: React.ReactNode}) => (
    <>{children}</>
  ),
}))
jest.mock('#/components/RichTextTag', () => {
  const {Text} = jest.requireActual('react-native')
  return {RichTextTag: ({display}: {display: string}) => <Text>{display}</Text>}
})
jest.mock('#/components/CodeBlock', () => {
  const {Text, View} = jest.requireActual('react-native')
  return {
    CodeBlock: ({
      code,
      displayCode = code,
    }: {
      code: string
      displayCode?: string
    }) => (
      <View testID="mock-code-block">
        <Text>{displayCode}</Text>
      </View>
    ),
    InlineCodeText: ({
      code,
      displayCode = code,
    }: {
      code: string
      displayCode?: string
    }) => <Text testID="mock-inline-code">{displayCode}</Text>,
  }
})

const originalPost =
  'Hey yo @bsky.app you should render embedded code blocks in our posts:\n\n```html\n<p>Like this</p>\n```'

function mentionAt(text: string, mention = '@bsky.app'): Facet {
  const source = new UnicodeString(text)
  const index = text.indexOf(mention)
  return {
    index: {
      byteStart: source.utf16IndexToUtf8Index(index),
      byteEnd: source.utf16IndexToUtf8Index(index + mention.length),
    },
    features: [
      {
        $type: 'app.bsky.richtext.facet#mention',
        did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      },
    ],
  }
}

function linkAt(text: string, url: `${string}:${string}`): Facet {
  const source = new UnicodeString(text)
  const index = text.indexOf(url)
  return {
    index: {
      byteStart: source.utf16IndexToUtf8Index(index),
      byteEnd: source.utf16IndexToUtf8Index(index + url.length),
    },
    features: [{$type: 'app.bsky.richtext.facet#link', uri: url}],
  }
}

it('renders the original fenced post while its outside mention stays clickable', () => {
  const value = new RichTextAPI({
    text: originalPost,
    facets: [mentionAt(originalPost)],
  })
  const onLinkPress = jest.fn()
  const screen = render(
    <PostBody
      value={value}
      testID="post-body"
      selectable
      shouldProxyLinks
      onLinkPress={onLinkPress}
    />,
  )

  expect(screen.getByTestId('mock-code-block')).toBeTruthy()
  expect(screen.UNSAFE_getByType(CodeBlock).props).toMatchObject({
    code: '<p>Like this</p>\n',
    lang: 'html',
  })
  expect(screen.UNSAFE_getByType(InlineLinkText).props).toMatchObject({
    children: '@bsky.app',
    to: '/profile/did:plc:z72i7hdynmk6r22z27h6tvur',
    selectable: true,
    shouldProxy: true,
    onPress: onLinkPress,
  })
  let parent = screen.getByTestId('mock-code-block').parent
  while (parent) {
    expect(parent.type).not.toBe(Text)
    expect(parent.type).not.toBe('Text')
    parent = parent.parent
  }
})

it.each(['`x`', '```js\nx\n```'])(
  'keeps a UTF-8 mention after code %j clickable',
  code => {
    const text = `${code}\n👋 @bsky.app`
    const screen = render(
      <PostBody value={new RichTextAPI({text, facets: [mentionAt(text)]})} />,
    )
    expect(screen.UNSAFE_getByType(InlineLinkText).props.children).toBe(
      '@bsky.app',
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
  },
)

it('keeps mentions and long URLs inside code literal and unshortened', () => {
  const url = 'https://example.com/a/very/long/path?q=1'
  const text = `\`\` @bsky.app ${url} \`\`\n\`\`\`\n${url}\n\`\`\``
  const firstLink = linkAt(text, url)
  const secondStart = text.lastIndexOf(url)
  const source = new UnicodeString(text)
  const secondLink = {
    ...firstLink,
    index: {
      byteStart: source.utf16IndexToUtf8Index(secondStart),
      byteEnd: source.utf16IndexToUtf8Index(secondStart + url.length),
    },
  }
  const screen = render(
    <PostBody
      value={
        new RichTextAPI({
          text,
          facets: [mentionAt(text), firstLink, secondLink],
        })
      }
    />,
  )
  expect(screen.queryAllByRole('link')).toHaveLength(0)
  expect(screen.UNSAFE_getByType(InlineCodeText).props).toMatchObject({
    code: ` @bsky.app ${url} `,
    displayCode: `@bsky.app ${url}`,
  })
  expect(screen.UNSAFE_getByType(CodeBlock).props.code).toBe(`${url}\n`)
})

it('preserves existing prose URL shortening alongside a formatted block', () => {
  const url = 'https://example.com/a/very/long/path?q=1'
  const text = `${url}\n\`\`\`\nx\n\`\`\``
  const screen = render(
    <PostBody value={new RichTextAPI({text, facets: [linkAt(text, url)]})} />,
  )
  expect(screen.UNSAFE_getByType(InlineLinkText).props).toMatchObject({
    to: url,
    children: 'example.com/a/very/long/...',
  })
})

it.each([
  '```\nx\n```',
  'before\n```\nx\n```\nafter',
  'before `inline`\n```\nx\n```',
])('places the suffix once after the complete post %j', text => {
  const screen = render(
    <PostBody
      value={new RichTextAPI({text})}
      suffix={<Text testID="post-number">2</Text>}
      suffixOffset={6}
      style={{paddingBottom: 17, marginBottom: 12}}
    />,
  )
  expect(screen.getAllByTestId('post-number')).toHaveLength(1)
  expect(screen.getByTestId('mock-code-block')).toBeTruthy()
  const json = screen.toJSON()
  if (!json || Array.isArray(json)) throw new Error('Expected one post root')
  const lastChild = json.children?.at(-1)
  expect(lastChild).toMatchObject({type: 'Text'})
  expect(JSON.stringify(lastChild)).toContain('post-number')
  if (!lastChild || typeof lastChild !== 'object') {
    throw new Error('Expected a suffix text paragraph')
  }
  expect(StyleSheet.flatten<TextStyle>(lastChild.props.style)).toMatchObject({
    paddingBottom: 6,
    marginBottom: -6,
  })
  for (const paragraph of json.children?.slice(0, -1) ?? []) {
    if (typeof paragraph === 'object' && paragraph.type === 'Text') {
      expect(
        StyleSheet.flatten<TextStyle>(paragraph.props.style),
      ).toMatchObject({
        paddingBottom: 17,
        marginBottom: 12,
      })
    }
  }
})

it.each([
  ['مرحبا `x` @bsky.app', 'right'],
  ['👋 123 مرحبا `x` @bsky.app', 'right'],
  ['hello `x` مرحبا @bsky.app', undefined],
  ['`x` مرحبا @bsky.app', undefined],
  ['مرحبا @bsky.app\n```js\nx\n```', 'right'],
] as const)(
  'preserves native first-strong alignment for %j',
  (text, textAlign) => {
    const screen = render(
      <PostBody value={new RichTextAPI({text, facets: [mentionAt(text)]})} />,
    )
    const json = screen.toJSON()
    if (!json || Array.isArray(json)) throw new Error('Expected one post root')
    const paragraph = json.children?.find(
      child => typeof child === 'object' && child.type === 'Text',
    )
    if (!paragraph || typeof paragraph !== 'object') {
      throw new Error('Expected an outer prose paragraph')
    }
    expect(
      StyleSheet.flatten<TextStyle>(paragraph.props.style)?.textAlign,
    ).toBe(textAlign)
    expect(screen.UNSAFE_getByType(InlineLinkText).props.children).toBe(
      '@bsky.app',
    )
  },
)

it('retains the numbered quote suffix and offset in a clamped code preview', () => {
  const text = '```js\n' + 'line\n'.repeat(21) + '```'
  const screen = render(
    <PostBody
      value={new RichTextAPI({text})}
      previewNumberOfLines={20}
      suffix={<Text testID="post-number">2</Text>}
      suffixOffset={6}
    />,
  )
  expect(screen.getAllByTestId('post-number')).toHaveLength(1)
  expect(screen.UNSAFE_getByType(RichText).props).toMatchObject({
    numberOfLines: 20,
    suffixOffset: 6,
  })
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
})

it('forwards disabled selection to prose and both code presentations', () => {
  const text = 'before `x`\n```\ny\n```'
  const screen = render(
    <PostBody value={new RichTextAPI({text})} selectable={false} />,
  )
  expect(screen.UNSAFE_getByType(InlineCodeText).props.selectable).toBe(false)
  expect(screen.UNSAFE_getByType(CodeBlock).props.selectable).toBe(false)
  expect(screen.getByText('before ').props.selectable).toBe(false)
})

it('keeps generic RichText literal for non-post surfaces', () => {
  const text = '```js\nx\n``` and `inline`'
  const screen = render(<RichText value={new RichTextAPI({text})} />)
  expect(screen.getByText(text)).toBeTruthy()
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
  expect(screen.queryByTestId('mock-inline-code')).toBeNull()
})

it('preserves the no-code emoji fast path and its requested multiplier', () => {
  const screen = render(
    <PostBody
      value={new RichTextAPI({text: '👋'})}
      testID="post-body"
      emojiMultiplier={2}
      style={{fontSize: 20}}
    />,
  )
  expect(
    StyleSheet.flatten<TextStyle>(screen.getByTestId('post-body').props.style)
      ?.fontSize,
  ).toBe(40)
  expect(screen.UNSAFE_queryAllByType(View)).toHaveLength(0)
})

it('keeps clamped previews as one original-source text with code facets suppressed', () => {
  const url = 'https://example.com/a/very/long/path?q=1'
  const text = `@bsky.app\n\n\`\`\`js\n${url}\n\`\`\``
  const value = new RichTextAPI({
    text,
    facets: [mentionAt(text), linkAt(text, url)],
  })
  const screen = render(
    <PostBody value={value} numberOfLines={3} testID="preview" />,
  )
  expect(screen.UNSAFE_queryAllByType(RichText)).toHaveLength(1)
  expect(screen.getByTestId('preview').props.numberOfLines).toBe(3)
  expect(screen.getByText(text, {normalizer: value => value})).toBeTruthy()
  expect(screen.UNSAFE_getByType(InlineLinkText).props.children).toBe(
    '@bsky.app',
  )
  expect(screen.queryAllByRole('link')).toHaveLength(1)
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
})

it('replaces block separator spacing while preserving Unicode facets and source', () => {
  const text =
    '```js\r\nx\r\n```\r\n\r\n👋 @bsky.app\r\n\r\n```html\r\n<p>x</p>\r\n```'
  const value = new RichTextAPI({text, facets: [mentionAt(text)]})
  const original = value.clone()
  const screen = render(<PostBody value={value} />)

  const prose = screen.UNSAFE_getByType(RichText).props.value as RichTextAPI
  expect(prose.text).toBe('👋 @bsky.app')
  expect(prose.facets?.[0].index).toEqual({byteStart: 5, byteEnd: 14})
  expect(screen.UNSAFE_getByType(InlineLinkText).props.children).toBe(
    '@bsky.app',
  )
  expect(
    screen.UNSAFE_getAllByType(CodeBlock).map(panel => panel.props.code),
  ).toEqual(['x\r\n', '<p>x</p>\r\n'])
  expect(value.text).toBe(original.text)
  expect(value.facets).toEqual(original.facets)
})

it.each([
  '```js\nx\n```\n\n\uFEFF @bsky.app',
  '\uFEFF @bsky.app\n\n```js\nx\n```',
])('preserves a prose BOM when replacing block spacing in %p', text => {
  const value = new RichTextAPI({text, facets: [mentionAt(text)]})
  const screen = render(<PostBody value={value} />)
  const prose = screen.UNSAFE_getByType(RichText).props.value as RichTextAPI
  expect(prose.text).toBe('\uFEFF @bsky.app')
  expect(prose.facets?.[0].index).toEqual({byteStart: 4, byteEnd: 13})
  expect(screen.UNSAFE_getByType(InlineLinkText).props.children).toBe(
    '@bsky.app',
  )
})

it('keeps the quote preview clamp on prose that may wrap without newlines', () => {
  const value = new RichTextAPI({text: 'long prose '.repeat(30)})
  const screen = render(<PostBody value={value} previewNumberOfLines={20} />)
  const prose = screen.UNSAFE_getByType(RichText)
  expect(prose.props.value).toBe(value)
  expect(prose.props.numberOfLines).toBe(20)
})

it('renders short code in a quote preview', () => {
  const screen = render(
    <PostBody
      value={new RichTextAPI({text: originalPost})}
      previewNumberOfLines={20}
    />,
  )
  expect(screen.getByTestId('mock-code-block')).toBeTruthy()
})

it('keeps long CR-only code quotes in one clamped original-source text', () => {
  const text = '```js\r' + 'line\r'.repeat(21) + '```'
  const screen = render(
    <PostBody value={new RichTextAPI({text})} previewNumberOfLines={20} />,
  )
  expect(screen.UNSAFE_getByType(RichText).props.numberOfLines).toBe(20)
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
  expect(screen.getByText(text, {normalizer: value => value})).toBeTruthy()
})

it('honors an explicit line clamp ahead of the short-code quote allowance', () => {
  const screen = render(
    <PostBody
      value={new RichTextAPI({text: originalPost})}
      numberOfLines={3}
      previewNumberOfLines={20}
    />,
  )
  expect(screen.UNSAFE_getByType(RichText).props.numberOfLines).toBe(3)
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
})
