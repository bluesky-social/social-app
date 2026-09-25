import {
  type EmbedPlayerType,
  getEmbedPlayerMediaType,
  parseEmbedPlayerFromUrl,
} from './embed-player'

describe('getEmbedPlayerMediaType', () => {
  it.each<
    readonly [EmbedPlayerType, ReturnType<typeof getEmbedPlayerMediaType>]
  >([
    ['youtube_video', 'video'],
    ['youtube_short', 'video'],
    ['twitch_video', 'video'],
    ['vimeo_video', 'video'],
    ['bluvy_tube_video', 'video'],
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

describe('parseEmbedPlayerFromUrl - Bluvy Tube', () => {
  it('parses AT-URI watch URLs', () => {
    expect(
      parseEmbedPlayerFromUrl(
        'https://tube.bluvy.app/watch/did:plc:ragtjsm2j2vknq6tfur4xmg6/3lbfm3qomxs2g',
      ),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri:
        'https://tube.bluvy.app/embed/at/did%3Aplc%3Aragtjsm2j2vknq6tfur4xmg6/3lbfm3qomxs2g',
    })
  })

  it('parses AT-URI /at/ URLs with handle', () => {
    expect(
      parseEmbedPlayerFromUrl(
        'https://tube.bluvy.app/at/alice.bsky.social/3k2p5abcdef',
      ),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri:
        'https://tube.bluvy.app/embed/at/alice.bsky.social/3k2p5abcdef',
    })
  })

  it('parses /embed/at/ URLs', () => {
    expect(
      parseEmbedPlayerFromUrl(
        'https://tube.bluvy.app/embed/at/did:plc:123/456',
      ),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri: 'https://tube.bluvy.app/embed/at/did%3Aplc%3A123/456',
    })
  })

  it('parses numeric /video/ and /embed/video/ URLs', () => {
    expect(
      parseEmbedPlayerFromUrl('https://tube.bluvy.app/video/12345'),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri: 'https://tube.bluvy.app/embed/video/12345',
    })

    expect(
      parseEmbedPlayerFromUrl('https://tube.bluvy.app/embed/video/12345'),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri: 'https://tube.bluvy.app/embed/video/12345',
    })
  })

  it('parses /embed/player with stream and poster', () => {
    expect(
      parseEmbedPlayerFromUrl(
        'https://tube.bluvy.app/embed/player?stream=https%3A%2F%2Fvideo.bsky.app%2Fplaylist.m3u8&poster=https%3A%2F%2Fcdn.bsky.app%2Fthumb.jpg',
      ),
    ).toEqual({
      type: 'bluvy_tube_video',
      source: 'bluvyTube',
      playerUri:
        'https://tube.bluvy.app/embed/player?stream=https%3A%2F%2Fvideo.bsky.app%2Fplaylist.m3u8&poster=https%3A%2F%2Fcdn.bsky.app%2Fthumb.jpg',
    })
  })

  it('returns undefined for invalid paths or origins', () => {
    expect(
      parseEmbedPlayerFromUrl('https://tube.bluvy.app/about'),
    ).toBeUndefined()
    expect(
      parseEmbedPlayerFromUrl('https://other-domain.app/watch/did:plc:123/456'),
    ).toBeUndefined()
  })
})
