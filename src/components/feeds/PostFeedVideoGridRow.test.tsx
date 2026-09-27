import {StyleSheet, View} from 'react-native'
import {render} from '@testing-library/react-native'

import {type FeedPostSliceItem} from '#/state/queries/post-feed'
import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'
import {
  PostFeedVideoGridRow,
  PostFeedVideoGridRowPlaceholder,
} from '#/components/feeds/PostFeedVideoGridRow'
import * as Grid from '#/components/Grid'

let mockGtMobile = false

jest.mock('#/alf', () => ({
  atoms: {
    flex_row: {flexDirection: 'row'},
    flex_col: {flexDirection: 'column'},
    flex_1: {flex: 1},
    gap_sm: {gap: 8},
  },
  useBreakpoints: () => ({gtMobile: mockGtMobile}),
  useGutters: () => ({}),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/components/VideoPostCard', () => {
  const {View} = require('react-native')

  return {
    VideoPostCard: () => <View testID="video-card" />,
    VideoPostCardPlaceholder: () => <View testID="video-placeholder" />,
  }
})

const items = [1, 2, 3].map(
  index =>
    ({
      post: {
        uri: `at://did:plc:example/app.bsky.feed.post/${index}`,
        embed: {$type: 'app.bsky.embed.video#view'},
      },
    }) as FeedPostSliceItem,
)
const sourceContext: VideoFeedSourceContext = {
  type: 'feedgen',
  uri: 'at://did:plc:example/app.bsky.feed.generator/videos',
  sourceInterstitial: 'none',
}

beforeEach(() => {
  mockGtMobile = false
})

describe.each([
  {layout: 'compact', gtMobile: false, columns: 2},
  {layout: 'wide', gtMobile: true, columns: 3},
])('$layout video feed grid', ({gtMobile, columns}) => {
  it('sizes every card to its share of the row', () => {
    mockGtMobile = gtMobile
    const result = render(
      <PostFeedVideoGridRow
        items={items.slice(0, columns)}
        sourceContext={sourceContext}
      />,
    )

    const cols = result.UNSAFE_getAllByType(Grid.Col)
    expect(cols).toHaveLength(columns)
    for (const col of cols) {
      expect(col.props.width).toBe(1 / columns)
      expect(
        StyleSheet.flatten(col.findByType(View).props.style),
      ).toMatchObject({
        width: `${(1 / columns) * 100}%`,
      })
    }
    expect(cols.reduce((total, col) => total + col.props.width, 0)).toBeCloseTo(
      1,
    )
  })

  it('keeps the same card width in a partial final row', () => {
    mockGtMobile = gtMobile
    const result = render(
      <PostFeedVideoGridRow
        items={items.slice(0, 1)}
        sourceContext={sourceContext}
      />,
    )

    expect(result.UNSAFE_getByType(Grid.Col).props.width).toBe(1 / columns)
  })

  it('renders the same number of loading placeholders as columns', () => {
    mockGtMobile = gtMobile
    const result = render(<PostFeedVideoGridRowPlaceholder />)

    expect(result.getAllByTestId('video-placeholder')).toHaveLength(columns)
  })
})

it('updates card widths and placeholders when the window crosses a breakpoint', () => {
  const result = render(
    <>
      <PostFeedVideoGridRow
        items={items.slice(0, 2)}
        sourceContext={sourceContext}
      />
      <PostFeedVideoGridRowPlaceholder />
    </>,
  )

  for (const gtMobile of [true, false]) {
    mockGtMobile = gtMobile
    const columns = gtMobile ? 3 : 2
    result.rerender(
      <>
        <PostFeedVideoGridRow
          items={items.slice(0, columns)}
          sourceContext={sourceContext}
        />
        <PostFeedVideoGridRowPlaceholder />
      </>,
    )

    const cols = result.UNSAFE_getAllByType(Grid.Col)
    expect(cols).toHaveLength(columns)
    expect(cols.every(col => col.props.width === 1 / columns)).toBe(true)
    expect(result.getAllByTestId('video-placeholder')).toHaveLength(columns)
  }
})
