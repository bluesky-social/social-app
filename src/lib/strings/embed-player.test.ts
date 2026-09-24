import {type EmbedPlayerType, getEmbedPlayerMediaType} from './embed-player'

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
