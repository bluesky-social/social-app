import {
  getLikelyType,
  getLinkMeta,
  LikelyType,
} from '../../src/lib/link-meta/link-meta'

describe('getLikelyType', () => {
  it('correctly handles non-parsed url', () => {
    const output = getLikelyType('https://example.com')
    expect(output).toEqual(LikelyType.HTML)
  })

  it('handles non-string urls without crashing', () => {
    const output = getLikelyType('123')
    expect(output).toEqual(LikelyType.Other)
  })
})

describe('getLinkMeta', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('fetches metadata for stream.place routes that look like files', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          error: '',
          description: 'AT Protocol livestreams',
          image: 'https://stream.place/thumbnail.jpg',
          title: 'atproto.com on stream.place',
        }),
    })
    global.fetch = fetchMock

    const output = await getLinkMeta('https://stream.place/atproto.com')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(output).toMatchObject({
      description: 'AT Protocol livestreams',
      image: 'https://stream.place/thumbnail.jpg',
      likelyType: LikelyType.HTML,
      title: 'atproto.com on stream.place',
    })
  })

  it('skips metadata fetching for direct image URLs', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock

    const output = await getLinkMeta('https://example.com/image.JPEG')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(output).toMatchObject({likelyType: LikelyType.Image})
  })
})
