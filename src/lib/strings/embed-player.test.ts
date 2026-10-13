import {
  type EmbedPlayerType,
  getEmbedPlayerMediaType,
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

describe.each(['staging.freemix.fm', 'app.freemix.fm'])(
  'FreeMix tracks on %s',
  host => {
    const actor = 'remixer.pds.staging.freemix.fm'
    const rkey = '3mx5yed3u7m2u'

    it.each(['', '/', '?ref=share#player'])(
      'embeds an actor-qualified track with suffix %s',
      suffix => {
        expect(
          parseEmbedPlayerFromUrl(
            `https://${host}/track/${actor}/${rkey}${suffix}`,
          ),
        ).toEqual({
          type: 'freemix_track',
          source: 'freemix',
          playerUri: `https://${host}/embed/${actor}/${rkey}`,
        })
      },
    )

    it.each([
      `/track/${actor}/${rkey}/tree`,
      `/track/${actor}/invalid`,
      `/track/${actor}/3mx5yed3u7m21`,
      `/track/${actor}`,
      `/track/${rkey}`,
      `/track//${rkey}`,
      `/profile/${actor}/${rkey}`,
    ])('does not embed unsupported path %s', path => {
      expect(parseEmbedPlayerFromUrl(`https://${host}${path}`)).toBeUndefined()
    })
  },
)

it.each(['freemix.fm', 'www.freemix.fm', 'staging.freemix.fm.example.com'])(
  'does not embed FreeMix tracks on unsupported host %s',
  host => {
    expect(
      parseEmbedPlayerFromUrl(
        `https://${host}/track/remixer.pds.staging.freemix.fm/3mx5yed3u7m2u`,
      ),
    ).toBeUndefined()
  },
)

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
