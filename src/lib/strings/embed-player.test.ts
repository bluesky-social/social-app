import {Dimensions} from 'react-native'

import {
  type EmbedPlayerType,
  getEmbedPlayerMediaType,
  getPlayerAspect,
} from './embed-player'

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
