import {describe, expect, it} from '@jest/globals'

import {
  createWidgetTopicUrl,
  parseWidgetTopicClick,
  stripWidgetTopicParams,
} from './links'

describe('createWidgetTopicUrl', () => {
  it('tags a relative topic link', () => {
    expect(
      createWidgetTopicUrl('/profile/trending.bsky.app/feed/abc', {
        rank: 2,
        recId: '123',
      }),
    ).toBe(
      'https://bsky.app/profile/trending.bsky.app/feed/abc?ref_src=widget&ref_rank=2&ref_rec_id=123',
    )
  })

  it('keeps an existing query and omits a missing recId', () => {
    expect(createWidgetTopicUrl('/search?q=bluesky', {rank: 1})).toBe(
      'https://bsky.app/search?q=bluesky&ref_src=widget&ref_rank=1',
    )
  })
})

describe('parseWidgetTopicClick', () => {
  it('reads back a tagged link', () => {
    const url = createWidgetTopicUrl('/profile/trending.bsky.app/feed/abc', {
      rank: 3,
      recId: '123',
    })
    expect(parseWidgetTopicClick(new URL(url))).toEqual({
      path: '/profile/trending.bsky.app/feed/abc',
      rank: 3,
      recId: '123',
    })
  })

  it('ignores other links', () => {
    expect(
      parseWidgetTopicClick(new URL('https://bsky.app/search?ref_src=embed')),
    ).toBeUndefined()
    expect(
      parseWidgetTopicClick(
        new URL('https://bsky.app/search?ref_src=widget&ref_rank=nope'),
      ),
    ).toBeUndefined()
  })
})

describe('stripWidgetTopicParams', () => {
  it('removes the widget params from native paths', () => {
    expect(
      stripWidgetTopicParams(
        'profile/trending.bsky.app/feed/abc?ref_src=widget&ref_rank=1&ref_rec_id=123',
      ),
    ).toBe('profile/trending.bsky.app/feed/abc')
  })

  it('keeps other params', () => {
    expect(
      stripWidgetTopicParams('/search?q=bluesky&ref_src=widget&ref_rank=1'),
    ).toBe('/search?q=bluesky')
  })

  it('leaves other paths alone', () => {
    expect(stripWidgetTopicParams('/search?q=bluesky&ref_src=embed')).toBe(
      '/search?q=bluesky&ref_src=embed',
    )
    expect(stripWidgetTopicParams('/profile/alice.bsky.social')).toBe(
      '/profile/alice.bsky.social',
    )
  })
})
