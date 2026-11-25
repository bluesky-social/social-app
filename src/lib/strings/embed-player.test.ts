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
    ['chzzk_video', 'video'],
    ['naver_clip', 'video'],
    ['soop_video', 'video'],
    ['soop_catch', 'video'],
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

  it.each<EmbedPlayerType>(['youtube_short', 'naver_clip', 'soop_catch'])(
    'updates %s sizing when the app window is resized',
    type => {
      const dimensions = jest.spyOn(Dimensions, 'get')
      const params = {type, hasThumb: true, width: 600}

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
    },
  )

  it.each<EmbedPlayerType>(['youtube_short', 'naver_clip', 'soop_catch'])(
    'preserves the %s placeholder aspect without a thumbnail',
    type => {
      expect(getPlayerAspect({type, hasThumb: false, width: 600})).toEqual({
        aspectRatio: 16 / 9,
      })
    },
  )
})

describe('CHZZK clips', () => {
  it.each(['chzzk.naver.com', 'm.chzzk.naver.com'])(
    'embeds shared clips from %s',
    host => {
      expect(
        parseEmbedPlayerFromUrl(`https://${host}/clips/clipId?share=true`),
      ).toEqual({
        type: 'chzzk_video',
        source: 'chzzk',
        playerUri: 'https://chzzk.naver.com/embed/clip/clipId?autoplay=1',
      })
    },
  )
})

describe('SOOP players', () => {
  it.each([
    [
      'play.sooplive.com/nanajam',
      'play.sooplive.com/nanajam/embed',
      'soop_video',
    ],
    [
      'play.sooplive.com/nanajam/298107873',
      'play.sooplive.com/nanajam/298107873/embed',
      'soop_video',
    ],
    [
      'vod.sooplive.com/player/210191551',
      'vod.sooplive.com/player/210191551/embed',
      'soop_video',
    ],
    [
      'vod.sooplive.com/player/210298737/catch',
      'vod.sooplive.com/player/210298737/embed',
      'soop_catch',
    ],
    [
      'play.sooplive.co.kr/streamer',
      'play.sooplive.co.kr/streamer/embed',
      'soop_video',
    ],
    [
      'play.sooplive.co.kr/streamer/12345',
      'play.sooplive.co.kr/streamer/12345/embed',
      'soop_video',
    ],
    [
      'vod.sooplive.co.kr/player/12345',
      'vod.sooplive.co.kr/player/12345/embed',
      'soop_video',
    ],
    [
      'vod.sooplive.co.kr/player/12345/catch',
      'vod.sooplive.co.kr/player/12345/embed',
      'soop_catch',
    ],
  ])('embeds %s', (url, player, type) => {
    expect(parseEmbedPlayerFromUrl(`https://${url}?ref=share`)).toEqual({
      type,
      source: 'soop',
      playerUri: `https://${player}?autoPlay=true&mutePlay=true${type === 'soop_catch' ? '&type=catch' : ''}`,
    })
  })

  it.each(['sooplive.com', 'www.sooplive.com'])(
    'embeds global channels and videos from %s',
    host => {
      for (const path of ['streamer', 'video/videoId']) {
        expect(parseEmbedPlayerFromUrl(`https://${host}/${path}`)).toEqual({
          type: 'soop_video',
          source: 'soop',
          playerUri: `https://www.sooplive.com/player/embed/${path}`,
        })
      }
    },
  )
})

it.each([
  'https://chzzk.naver.com/clips/',
  'https://chzzk.naver.com/video/12345',
  'https://chzzk.naver.com/clips/clipId/extra',
  'https://chzzk.naver.com.example.com/clips/clipId',
  'https://play.sooplive.com/',
  'https://play.sooplive.com/nanajam/not-a-broadcast',
  'https://play.sooplive.com.example.com/nanajam/298107873',
  'https://vod.sooplive.com/player/',
  'https://vod.sooplive.com/player/not-a-video',
  'https://vod.sooplive.com/player/210191551/unknown',
  'https://vod.sooplive.com.example.com/player/210191551',
  'https://play.sooplive.co.kr/',
  'https://play.sooplive.co.kr/streamer/not-a-broadcast',
  'https://vod.sooplive.co.kr/player/',
  'https://vod.sooplive.co.kr/player/not-a-video',
  'https://vod.sooplive.co.kr/player/12345/unknown',
  'https://vod.sooplive.co.kr.example.com/player/12345',
  'https://sooplive.com/video',
  'https://sooplive.com/video/videoId/extra',
  'https://sooplive.com.example.com/streamer',
  'https://tv.naver.com/v/12345',
  'https://tv.naver.com/h/12345',
])('leaves unsupported links as regular link cards: %s', url => {
  expect(parseEmbedPlayerFromUrl(url)).toBeUndefined()
})

describe('NAVER Clip', () => {
  const id = '781A7BB2AC2E78EE02B75508428F425CE66C'

  it.each(['CLIP', 'CHZZK'])(
    'preserves the %s service in the embed URL',
    service => {
      for (const path of ['/shorts', '/shorts/']) {
        expect(
          parseEmbedPlayerFromUrl(
            `https://m.naver.com${path}?serviceType=${service}&seedMediaId=${id}&ref=share`,
          ),
        ).toEqual({
          type: 'naver_clip',
          source: 'naverClip',
          playerUri: `https://clip-viewer.naver.com/oembed/?seedMediaId=${id}&mediaType=SHORT_FORM&serviceType=${service}`,
        })
      }
    },
  )

  it.each([
    `https://m.naver.com/shorts/?seedMediaId=${id}`,
    'https://m.naver.com/shorts/?serviceType=CLIP',
    'https://m.naver.com/shorts/?seedMediaId=invalid&serviceType=CLIP',
    `https://m.naver.com/shorts/?seedMediaId=${id}&serviceType=UNKNOWN`,
    `https://m.naver.com/shorts/extra?seedMediaId=${id}&serviceType=CLIP`,
    `https://m.naver.com.example.com/shorts/?seedMediaId=${id}&serviceType=CLIP`,
    `ftp://m.naver.com/shorts/?seedMediaId=${id}&serviceType=CLIP`,
  ])('does not embed unsupported URL %s', url => {
    expect(parseEmbedPlayerFromUrl(url)).toBeUndefined()
  })

  it.each([true, false])('matches Shorts sizing with hasThumb=%s', hasThumb => {
    expect(getPlayerAspect({type: 'naver_clip', hasThumb, width: 393})).toEqual(
      getPlayerAspect({type: 'youtube_short', hasThumb, width: 393}),
    )
    expect(
      getPlayerAspect({type: 'chzzk_video', hasThumb, width: 393}),
    ).toEqual({aspectRatio: 16 / 9})
  })
})
