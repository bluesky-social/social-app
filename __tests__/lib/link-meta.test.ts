import {
  LikelyType,
  getLinkMeta,
  getLikelyType,
} from '../../src/lib/link-meta/link-meta'
import {exampleComHtml} from './__mocks__/exampleComHtml'
import {BskyAgent} from '@atproto/api'
import {DEFAULT_SERVICE, RootStoreModel} from '../../src/state'

describe('getLinkMeta', () => {
  let rootStore: RootStoreModel

  beforeEach(() => {
    rootStore = new RootStoreModel(new BskyAgent({service: DEFAULT_SERVICE}))
  })

  const inputs = [
    '',
    'httpbadurl',
    'https://example.com',
    'https://example.com/index.html',
    'https://example.com/image.png',
    'https://example.com/video.avi',
    'https://example.com/audio.ogg',
    'https://example.com/text.txt',
    'https://example.com/javascript.js',
    'https://bsky.app/',
    'https://bsky.app/index.html',
  ]
  const outputs = [
    {
      error: 'Invalid URL',
      likelyType: LikelyType.Other,
      url: '',
    },
    {
      error: 'Invalid URL',
      likelyType: LikelyType.Other,
      url: 'httpbadurl',
    },
    {
      likelyType: LikelyType.HTML,
      url: 'https://example.com',
      title: 'Example Domain',
      description: 'An example website',
    },
    {
      likelyType: LikelyType.HTML,
      url: 'https://example.com/index.html',
      title: 'Example Domain',
      description: 'An example website',
    },
    {
      likelyType: LikelyType.Image,
      url: 'https://example.com/image.png',
    },
    {
      likelyType: LikelyType.Video,
      url: 'https://example.com/video.avi',
    },
    {
      likelyType: LikelyType.Audio,
      url: 'https://example.com/audio.ogg',
    },
    {
      likelyType: LikelyType.Text,
      url: 'https://example.com/text.txt',
    },
    {
      likelyType: LikelyType.Other,
      url: 'https://example.com/javascript.js',
    },
    {
      likelyType: LikelyType.AtpData,
      url: '/',
    },
    {
      likelyType: LikelyType.AtpData,
      url: '/index.html',
    },
    {
      likelyType: LikelyType.Other,
      url: '',
      title: '',
    },
  ]
  it('correctly handles a set of text inputs', async () => {
    for (let i = 0; i < inputs.length; i++) {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return new Promise((resolve, _reject) => {
          resolve({
            ok: true,
            status: 200,
            text: () => exampleComHtml,
          })
        })
      })
      const input = inputs[i]
      const output = await getLinkMeta(rootStore, input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('getLikelyType', () => {
  it('correctly handles non-parsed url', async () => {
    const output = await getLikelyType('https://example.com')
    expect(output).toEqual(LikelyType.HTML)
  })

  it('handles non-string urls without crashing', async () => {
    const output = await getLikelyType('123')
    expect(output).toEqual(LikelyType.Other)
  })
})
