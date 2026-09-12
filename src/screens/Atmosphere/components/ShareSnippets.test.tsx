import {type GestureResponderEvent} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, within} from '@testing-library/react-native'

import {formatCount} from '#/view/com/util/numeric/format'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Mark as BlueskyIcon} from '#/components/icons/Logo'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {
  createActivity,
  createActor,
  createRecord,
  createShareRecord,
  createShareView,
} from '../testFixtures'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
  type ShareRecord,
} from '../types'
import {ShareSnippets} from './ShareSnippets'

const mockButtonProps = jest.fn()
const mockLinkProps = jest.fn()
type RichTextProps = React.ComponentProps<
  typeof import('#/components/RichText').RichText
>
const mockRichTextProps = jest.fn((_props: RichTextProps) => {})
const mockUseLinkProps = jest.fn()
const mockActorLineProps = jest.fn()
const mockOpenThread = jest.fn()

type Children = {children?: React.ReactNode}

i18n.loadAndActivate({locale: 'en', messages: {}})
i18n.load('de', {})

jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {},
    {
      get: (_, key) =>
        key === 'text_xs'
          ? {fontSize: 12}
          : key === 'justify_start'
            ? {justifyContent: 'flex-start'}
            : key === 'ml_auto'
              ? {marginLeft: 'auto'}
              : {},
    },
  ),
  useTheme: () => ({
    atoms: {
      bg_contrast_50: {},
      text: {},
      text_contrast_low: {color: '#8993a4'},
      text_contrast_medium: {color: '#5d6879'},
    },
    palette: {primary_500: '#006aff'},
  }),
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({children, ...props}: Children & Record<string, unknown>) => {
      mockButtonProps(props)
      return <Pressable {...props}>{children}</Pressable>
    },
    ButtonText: ({children}: Children) => <Text>{children}</Text>,
  }
})
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({children, ...props}: Children & Record<string, unknown>) => {
      mockLinkProps(props)
      return <Pressable {...props}>{children}</Pressable>
    },
    useLink: (props: unknown) => {
      mockUseLinkProps(props)
      return {onPress: mockOpenThread}
    },
  }
})
jest.mock('#/components/RichText', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    RichText: (props: RichTextProps) => {
      mockRichTextProps(props)
      return (
        <Text {...props}>
          {typeof props.value === 'string' ? props.value : props.value.text}
        </Text>
      )
    },
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('./ActivityPrimitives', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ActivityActorLine: (props: Record<string, unknown>) => {
      mockActorLineProps(props)
      return <View testID="share-actor-line" />
    },
  }
})

type ShareFixture = {
  activity: ReturnType<typeof createActivity>
  actor: ActivityActor
  record: ShareRecord
}

function createShare(index: number, text = `Post ${index}`): ShareFixture {
  const activity = createActivity({
    collection: activityCollections.share,
    did: `did:plc:sharer${index}`,
    rkey: `post${index}`,
  })
  const actor = createActor(`did:plc:sharer${index}`)
  const record = {...createShareRecord(), text} as ShareRecord
  return {activity, actor, record}
}

function renderShares(
  shares: ShareFixture[],
  showActorMetadata?: boolean,
  missingRecordUris: string[] = [],
  hideActorMetadataForDid?: string,
) {
  const missing = new Set(missingRecordUris)
  const associatedRecords = Object.fromEntries(
    shares
      .filter(({activity}) => !missing.has(activity.record.uri))
      .map(({activity, record}) => [
        activity.record.uri,
        createRecord(activity.record.uri, record),
      ]),
  )
  return render(
    <I18nProvider i18n={i18n}>
      <ShareSnippets
        shares={shares.map(({activity, actor}) => ({activity, actor}))}
        associatedRecords={associatedRecords}
        showActorMetadata={showActorMetadata}
        hideActorMetadataForDid={hideActorMetadataForDid}
      />
    </I18nProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  i18n.activate('en')
})

describe('ShareSnippets', () => {
  it.each([1, 2, 3])(
    'shows overflow only above two usable posts (%s)',
    count => {
      const screen = renderShares(
        Array.from({length: count}, (_, i) => createShare(i)),
      )
      expect(screen.getAllByTestId('atmosphereShareSnippet')).toHaveLength(
        Math.min(count, 2),
      )
      expect(Boolean(screen.queryByTestId('atmosphereShareExpand'))).toBe(
        count > 2,
      )
      if (count === 3) expect(screen.getByText('1 more post')).toBeTruthy()
    },
  )

  it('shows two posts, expands the remainder, and collapses again', () => {
    const shares = [0, 1, 2, 3].map(index => createShare(index))
    const screen = renderShares(shares)

    expect(screen.getAllByTestId('atmosphereShareSnippet')).toHaveLength(2)
    expect(screen.getByTestId('atmosphereShareExpand')).toBeTruthy()
    expect(screen.getByText('2 more posts')).toBeTruthy()

    fireEvent.press(screen.getByTestId('atmosphereShareExpand'))
    expect(screen.getAllByTestId('atmosphereShareSnippet')).toHaveLength(4)
    expect(screen.getByTestId('atmosphereShareCollapse')).toBeTruthy()
    expect(screen.getByText('Show fewer posts')).toBeTruthy()

    fireEvent.press(screen.getByTestId('atmosphereShareCollapse'))
    expect(screen.getAllByTestId('atmosphereShareSnippet')).toHaveLength(2)
  })

  it('counts only usable shares and preserves thread access for empty text', () => {
    const empty = createShare(0, '   ')
    const invalid = createShare(1)
    invalid.activity.record.uri =
      'at://did:plc:other/app.bsky.feed.post/wrong-owner'
    const missing = createShare(2)
    const malformed = createShare(3)
    Object.assign(malformed.record, {text: 42})
    const shares = [empty, invalid, missing, malformed]
    const screen = renderShares(shares, undefined, [
      missing.activity.record.uri,
    ])

    expect(screen.getAllByTestId('atmosphereShareSnippet')).toHaveLength(1)
    expect(screen.queryByTestId('atmosphereShareText')).toBeNull()
    expect(screen.queryByTestId('atmosphereShareExpand')).toBeNull()
    expect(mockLinkProps).toHaveBeenCalledWith(
      expect.objectContaining({to: '/profile/sharer0.example/post/post0'}),
    )
  })

  it('can omit actor metadata while retaining the indexed post time when enabled', () => {
    const share = createShare(0)
    renderShares([share], false)
    expect(mockActorLineProps).not.toHaveBeenCalled()

    renderShares([share], true)
    expect(mockActorLineProps).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: share.activity.record.indexedAt,
      }),
    )
  })

  it('omits actor metadata only for a matching article author', () => {
    const authorShare = createShare(0)
    const otherShare = createShare(1)
    renderShares(
      [authorShare, otherShare],
      undefined,
      [],
      authorShare.actor.did,
    )

    expect(mockActorLineProps).toHaveBeenCalledTimes(1)
    expect(mockActorLineProps).toHaveBeenCalledWith(
      expect.objectContaining({actors: [otherShare.actor]}),
    )
  })

  it('renders ordered, themed, localized metrics beneath the post text', () => {
    const share = createShare(0)
    share.activity.view = createShareView({
      likeCount: 1234,
      repostCount: 56_789,
      replyCount: 0,
      quoteCount: 321,
      bookmarkCount: 654,
    })
    const screen = renderShares([share])
    const quote = screen.getByTestId('atmosphereShareQuote')
    const metrics = within(quote).getByTestId('atmosphereShareMetrics')

    expect(metrics.props.style).toEqual(
      expect.arrayContaining([{justifyContent: 'flex-start'}]),
    )
    expect(
      metrics.children.map(child =>
        typeof child === 'string' ? child : child.props.testID,
      ),
    ).toEqual([
      'atmosphereShareLikeMetric',
      'atmosphereShareRepostMetric',
      'atmosphereShareReplyMetric',
      'atmosphereShareBlueskyAttribution',
    ])

    for (const Icon of [HeartIcon, RepostIcon, ReplyIcon]) {
      const icon = screen.UNSAFE_getByType(Icon)
      expect(icon.props).toEqual(
        expect.objectContaining({size: 'xs', fill: '#8993a4'}),
      )
    }
    const attribution = screen.getByTestId('atmosphereShareBlueskyAttribution')
    expect(attribution.props.style).toEqual(
      expect.arrayContaining([{marginLeft: 'auto'}]),
    )
    expect(within(attribution).getByText('via').props.style).toEqual(
      expect.arrayContaining([{fontSize: 12}]),
    )
    expect(within(attribution).getByText('Bluesky').props.style).toEqual(
      expect.arrayContaining([{fontSize: 12}]),
    )
    expect(screen.UNSAFE_getByType(BlueskyIcon).props).toEqual(
      expect.objectContaining({size: 'xs', fill: '#006aff'}),
    )
    expect(screen.getByTestId('atmosphereShareLikeCount')).toHaveTextContent(
      formatCount(i18n, 1234),
    )
    expect(screen.getByTestId('atmosphereShareRepostCount')).toHaveTextContent(
      formatCount(i18n, 56_789),
    )
    expect(screen.getByTestId('atmosphereShareReplyCount')).toHaveTextContent(
      '0',
    )
    for (const count of [
      'atmosphereShareLikeCount',
      'atmosphereShareRepostCount',
      'atmosphereShareReplyCount',
    ]) {
      expect(screen.getByTestId(count).props.style).toEqual(
        expect.arrayContaining([{fontSize: 12}, {color: '#5d6879'}]),
      )
    }
    expect(screen.queryByText('321')).toBeNull()
    expect(screen.queryByText('654')).toBeNull()
  })

  it('localizes large counts and renders metrics for an empty post', () => {
    i18n.activate('de')
    const share = createShare(0, '   ')
    share.activity.view = createShareView({
      likeCount: 0,
      repostCount: 12_345,
      replyCount: 9_876_543,
    })
    const screen = renderShares([share])

    expect(screen.getByTestId('atmosphereShareLikeCount')).toHaveTextContent(
      formatCount(i18n, 0),
    )
    expect(screen.getByTestId('atmosphereShareRepostCount')).toHaveTextContent(
      formatCount(i18n, 12_345),
    )
    expect(screen.getByTestId('atmosphereShareReplyCount')).toHaveTextContent(
      formatCount(i18n, 9_876_543),
    )
  })

  it.each([
    undefined,
    {$type: 'eric.bsky.atmosphere.getActivity#photoView'},
    {$type: 'eric.bsky.atmosphere.getActivity#shareView', likeCount: 1},
  ])('omits metrics for absent, wrong, or malformed views (%j)', view => {
    const share = createShare(0)
    share.activity.view = view as ActivityItem['view']
    const screen = renderShares([share])
    expect(screen.queryByTestId('atmosphereShareMetrics')).toBeNull()
  })

  it('keeps quote, facet, and already-prevented thread events independent', () => {
    const share = createShare(0, 'hello @alice café 🌐')
    const facet = {
      index: {byteStart: 6, byteEnd: 12},
      features: [
        {
          $type: 'app.bsky.richtext.facet#mention',
          did: 'did:plc:alice',
        },
      ],
    } as NonNullable<ShareRecord['facets']>[number]
    share.record.facets = [facet]
    const screen = renderShares([share])
    expect(
      within(screen.getByTestId('atmosphereShareQuote')).queryByTestId(
        'share-actor-line',
      ),
    ).toBeNull()
    expect(mockButtonProps).toHaveBeenCalledWith(
      expect.objectContaining({
        testID: 'atmosphereShareQuote',
        label: share.record.text,
        role: 'link',
      }),
    )

    const richTextProps = mockRichTextProps.mock.calls[0][0]
    if (!(richTextProps.value instanceof RichTextAPI))
      throw new Error('Expected rich text')
    expect(richTextProps.value.text).toBe(share.record.text)
    expect(richTextProps.value.facets).toEqual([facet])
    expect(mockUseLinkProps).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/profile/sharer0.example/post/post0',
      }),
    )

    const quote = screenButtonProps('atmosphereShareQuote')
    expect(quote).not.toHaveProperty('href')
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    quote.onPress(event)
    expect(mockOpenThread).toHaveBeenCalledTimes(1)

    richTextProps.onLinkPress?.(event as GestureResponderEvent)
    quote.onPress(event)
    expect(mockOpenThread).toHaveBeenCalledTimes(1)

    const prevented = {
      defaultPrevented: true,
      preventDefault: jest.fn(),
    }
    quote.onPress(prevented)
    expect(mockOpenThread).toHaveBeenCalledTimes(1)
  })

  it('preserves long Unicode text, real UTF-8 facets, and the original sidecar order', () => {
    const text = `🌐 café @alice #tag https://example.com\n${'مرحبا '.repeat(50)}`
    const share = createShare(0, text)
    type Facet = NonNullable<ShareRecord['facets']>[number]
    const facetFor = (
      token: string,
      feature: Facet['features'][number],
    ): Facet => {
      const start = text.indexOf(token)
      const byteStart = Buffer.byteLength(text.slice(0, start), 'utf8')
      return {
        index: {
          byteStart,
          byteEnd: byteStart + Buffer.byteLength(token, 'utf8'),
        },
        features: [feature],
      }
    }
    const mention = facetFor('@alice', {
      $type: 'app.bsky.richtext.facet#mention',
      did: 'did:plc:alice',
    })
    const tag = facetFor('#tag', {
      $type: 'app.bsky.richtext.facet#tag',
      tag: 'tag',
    })
    const link = facetFor('https://example.com', {
      $type: 'app.bsky.richtext.facet#link',
      uri: 'https://example.com',
    })
    const facets = [link, mention, tag]
    share.record.facets = facets
    renderShares([share])
    const props = mockRichTextProps.mock.calls[0][0]
    if (!(props.value instanceof RichTextAPI))
      throw new Error('Expected rich text')
    expect(props.value.text).toBe(text)
    expect(
      [...props.value.segments()].map(segment => segment.text).join(''),
    ).toBe(text)
    expect(props.value.facets?.[0]).toBe(mention)
    expect(props.value.facets?.[1]).toBe(tag)
    expect(props.value.facets?.[2]).toBe(link)
    expect(share.record.facets).toBe(facets)
    expect(facets).toEqual([link, mention, tag])
    expect(share.record.text).toBe(text)
    expect(props).toEqual(
      expect.objectContaining({
        numberOfLines: 4,
        enableTags: true,
        shouldProxyLinks: true,
        authorHandle: share.actor.handle,
      }),
    )
  })

  it.each([
    ['🌐🌐', false],
    ['🌐'.repeat(30), true],
    ['🌐 '.repeat(30), true],
  ])(
    'caps emoji text through the appropriate path (%s)',
    (text, usesRichText) => {
      const share = createShare(0, text)
      const screen = renderShares([share])
      const quoteText = screen.getByTestId('atmosphereShareText')

      expect(mockRichTextProps.mock.calls.length > 0).toBe(usesRichText)
      expect(quoteText.props.numberOfLines).toBe(4)
      expect(quoteText.props.children).toBe(share.record.text)
    },
  )
})

function screenButtonProps(testID: string) {
  const props = mockButtonProps.mock.calls
    .map(([value]) => value as Record<string, unknown>)
    .find(value => value.testID === testID)
  if (!props) throw new Error(`Missing button ${testID}`)
  return props as {
    onPress: (event: {
      defaultPrevented: boolean
      preventDefault: () => void
    }) => void
  }
}
