import {StyleSheet, Text, type TextStyle} from 'react-native'
import {
  type Facet,
  RichText as RichTextAPI,
  UnicodeString,
} from '@bsky/sdk/richtext'
import {render} from '@testing-library/react-native'

import {CodeBlock, InlineCode} from '#/components/CodeBlock'
import {InlineLinkText} from '#/components/Link'
import {PostBody} from '#/components/Post/PostBody'
import {RichText} from '#/components/RichText'

jest.mock('#/alf', () => ({
  atoms: {
    text_sm: {fontSize: 14},
    text_right: {textAlign: 'right'},
    w_full: {width: '100%'},
  },
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
    CodeBlock: ({code}: {code: string}) => (
      <View testID="mock-code-block">
        <Text>{code}</Text>
      </View>
    ),
    InlineCode: ({code}: {code: string}) => <Text>{code}</Text>,
  }
})

const originalPost =
  'Hey yo @bsky.app you should render embedded code blocks in our posts:\n\n```html\n<p>Like this</p>\n```'

function facetAt(
  text: string,
  part: string,
  feature: Facet['features'][number],
): Facet {
  const source = new UnicodeString(text)
  const index = text.lastIndexOf(part)
  return {
    index: {
      byteStart: source.utf16IndexToUtf8Index(index),
      byteEnd: source.utf16IndexToUtf8Index(index + part.length),
    },
    features: [feature],
  }
}

function mentionAt(text: string) {
  return facetAt(text, '@bsky.app', {
    $type: 'app.bsky.richtext.facet#mention',
    did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
  })
}

function linkAt(text: string, url: `${string}:${string}`) {
  return facetAt(text, url, {
    $type: 'app.bsky.richtext.facet#link',
    uri: url,
  })
}

it('renders a code block beside the text, not inside it', () => {
  const value = new RichTextAPI({
    text: originalPost,
    facets: [mentionAt(originalPost)],
  })
  const screen = render(<PostBody value={value} selectable />)

  expect(screen.UNSAFE_getByType(CodeBlock).props).toMatchObject({
    code: '<p>Like this</p>',
    lang: 'html',
    selectable: true,
  })
  expect(screen.UNSAFE_getByType(InlineLinkText).props).toMatchObject({
    children: '@bsky.app',
    to: '/profile/did:plc:z72i7hdynmk6r22z27h6tvur',
  })
  let parent = screen.getByTestId('mock-code-block').parent
  while (parent) {
    expect(parent.type).not.toBe(Text)
    parent = parent.parent
  }
})

it('keeps inline code in the same paragraph as the text around it', () => {
  const text = 'Run `pnpm web` now'
  const screen = render(<PostBody value={new RichTextAPI({text})} />)

  expect(screen.UNSAFE_getByType(InlineCode).props.code).toBe('pnpm web')
  expect(screen.getByText('Run pnpm web now')).toBeTruthy()
})

it('keeps mentions and links inside code literal', () => {
  const url = 'https://example.com/path'
  const text = `\`@bsky.app\`\n\`\`\`\n${url}\n\`\`\``
  const screen = render(
    <PostBody
      value={
        new RichTextAPI({text, facets: [mentionAt(text), linkAt(text, url)]})
      }
    />,
  )

  expect(screen.queryAllByRole('link')).toHaveLength(0)
  expect(screen.UNSAFE_getByType(CodeBlock).props.code).toBe(url)
})

it.each(['```\nx\n```', 'before\n```\nx\n```\nafter'])(
  'puts the suffix once, at the end of %j',
  text => {
    const screen = render(
      <PostBody
        value={new RichTextAPI({text})}
        suffix={<Text testID="post-number">2</Text>}
        suffixOffset={6}
      />,
    )
    const json = screen.toJSON()
    if (!json || Array.isArray(json)) throw new Error('Expected one root')
    const last = json.children?.at(-1)
    if (!last || typeof last !== 'object') throw new Error('Expected text')

    expect(screen.getAllByTestId('post-number')).toHaveLength(1)
    expect(JSON.stringify(last)).toContain('post-number')
    expect(StyleSheet.flatten<TextStyle>(last.props.style)).toMatchObject({
      paddingBottom: 6,
      marginBottom: -6,
    })
  },
)

it.each([
  ['مرحبا `x`', 'right'],
  ['hello `x` مرحبا', undefined],
] as const)('aligns %j by its first strong character', (text, textAlign) => {
  const screen = render(<PostBody value={new RichTextAPI({text})} />)
  const json = screen.toJSON()
  if (!json || Array.isArray(json)) throw new Error('Expected one root')
  const paragraph = json.children?.[0]
  if (!paragraph || typeof paragraph !== 'object') throw new Error('No text')

  expect(StyleSheet.flatten<TextStyle>(paragraph.props.style)?.textAlign).toBe(
    textAlign,
  )
})

it('renders a clamped post as one text, without links inside code', () => {
  const url = 'https://example.com/path'
  const text = `@bsky.app\n\n\`\`\`\n${url}\n\`\`\``
  const screen = render(
    <PostBody
      value={
        new RichTextAPI({text, facets: [mentionAt(text), linkAt(text, url)]})
      }
      numberOfLines={3}
    />,
  )

  expect(screen.UNSAFE_getByType(RichText).props.numberOfLines).toBe(3)
  expect(screen.getAllByRole('link')).toHaveLength(1)
  expect(screen.queryByTestId('mock-code-block')).toBeNull()
})

describe('previewNumberOfLines', () => {
  it('shows code panels in a short preview', () => {
    const screen = render(
      <PostBody
        value={new RichTextAPI({text: originalPost})}
        previewNumberOfLines={20}
      />,
    )
    expect(screen.getByTestId('mock-code-block')).toBeTruthy()
  })

  it('clamps a long preview', () => {
    const text = '```js\n' + 'line\n'.repeat(21) + '```'
    const screen = render(
      <PostBody value={new RichTextAPI({text})} previewNumberOfLines={20} />,
    )
    expect(screen.UNSAFE_getByType(RichText).props.numberOfLines).toBe(20)
    expect(screen.queryByTestId('mock-code-block')).toBeNull()
  })

  it('clamps a preview without code', () => {
    const screen = render(
      <PostBody
        value={new RichTextAPI({text: 'prose'})}
        previewNumberOfLines={20}
      />,
    )
    expect(screen.UNSAFE_getByType(RichText).props.numberOfLines).toBe(20)
  })
})
