import {Dimensions} from 'react-native'

import {
  type EmbedPlayerType,
  getEmbedPlayerMediaType,
  getPlayerAspect,
  parseEmbedPlayerFromUrl,
} from '#/lib/strings/embed-player'

describe.each([
  'https://youtu.be/videoId',
  'https://www.youtube.com/watch?v=videoId',
])('YouTube start time for %s', videoUrl => {
  it.each([
    ['1h', 3600],
    ['2m', 120],
    ['1h3s', 3603],
    ['90', 90],
    ['90s', 90],
  ])('converts t=%s to %i seconds', (timestamp, seconds) => {
    const url = new URL(videoUrl)
    url.searchParams.set('t', timestamp)

    expect(parseEmbedPlayerFromUrl(url.href)?.playerUri).toBe(
      `https://bsky.app/iframe/youtube.html?videoId=videoId&start=${seconds}`,
    )
  })

  it.each([null, '', 'invalid', '-30', '1m30sfoo'])(
    'defaults to zero for missing or invalid t=%s',
    timestamp => {
      const url = new URL(videoUrl)
      if (timestamp !== null) url.searchParams.set('t', timestamp)

      expect(parseEmbedPlayerFromUrl(url.href)?.playerUri).toBe(
        'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
      )
    },
  )
})
describe('getEmbedPlayerMediaType', () => {
  it.each<
    readonly [EmbedPlayerType, ReturnType<typeof getEmbedPlayerMediaType>]
  >([
    ['youtube_video', 'video'],
    ['youtube_short', 'video'],
    ['twitch_video', 'video'],
    ['vimeo_video', 'video'],
    ['spotify_song', 'audio'],
    ['soundcloud_set', 'audio'],
    ['apple_music_album', 'audio'],
    ['bandcamp_track', 'audio'],
    ['freemix_track', 'audio'],
    ['giphy_gif', 'gif'],
    ['flickr_album', 'other'],
  ])('classifies %s as %s', (type, expected) => {
    expect(getEmbedPlayerMediaType(type)).toBe(expected)
  })
})

describe('getPlayerAspect', () => {
  afterEach(() => jest.restoreAllMocks())

  it('updates portrait video sizing when the app window is resized', () => {
    const dimensions = jest.spyOn(Dimensions, 'get')
    const params = {type: 'youtube_short', hasThumb: true, width: 600} as const

    dimensions.mockReturnValue({
      width: 1024,
      height: 1366,
      scale: 2,
      fontScale: 1,
    })
    expect(getPlayerAspect(params)).toEqual({aspectRatio: (9 / 16) * 1.5})

    dimensions.mockReturnValue({
      width: 1024,
      height: 599,
      scale: 2,
      fontScale: 1,
    })
    expect(getPlayerAspect(params)).toEqual({aspectRatio: (9 / 16) * 1.75})
    expect(dimensions).toHaveBeenLastCalledWith('window')

    dimensions.mockReturnValue({
      width: 744,
      height: 1133,
      scale: 2,
      fontScale: 1,
    })
    expect(getPlayerAspect(params)).toEqual({aspectRatio: (9 / 16) * 1.5})
  })

  it('preserves the placeholder aspect without a thumbnail', () => {
    expect(
      getPlayerAspect({type: 'youtube_short', hasThumb: false, width: 600}),
    ).toEqual({aspectRatio: 16 / 9})
  })
})
