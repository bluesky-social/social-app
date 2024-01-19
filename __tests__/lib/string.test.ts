import {RichText} from '@atproto/api'
import {
  makeRecordUri,
  toNiceDomain,
  toShortUrl,
  toShareUrl,
} from '../../src/lib/strings/url-helpers'
import {pluralize, enforceLen} from '../../src/lib/strings/helpers'
import {ago} from '../../src/lib/strings/time'
import {detectLinkables} from '../../src/lib/strings/rich-text-detection'
import {shortenLinks} from '../../src/lib/strings/rich-text-manip'
import {makeValidHandle, createFullHandle} from '../../src/lib/strings/handles'
import {cleanError} from '../../src/lib/strings/errors'
import {parseEmbedPlayerFromUrl} from 'lib/strings/embed-player'

describe('detectLinkables', () => {
  const inputs = [
    'no linkable',
    '@start middle end',
    'start @middle end',
    'start middle @end',
    '@start @middle @end',
    '@full123.test-of-chars',
    'not@right',
    '@bad!@#$chars',
    '@newline1\n@newline2',
    'parenthetical (@handle)',
    'start https://middle.com end',
    'start https://middle.com/foo/bar end',
    'start https://middle.com/foo/bar?baz=bux end',
    'start https://middle.com/foo/bar?baz=bux#hash end',
    'https://start.com/foo/bar?baz=bux#hash middle end',
    'start middle https://end.com/foo/bar?baz=bux#hash',
    'https://newline1.com\nhttps://newline2.com',
    'start middle.com end',
    'start middle.com/foo/bar end',
    'start middle.com/foo/bar?baz=bux end',
    'start middle.com/foo/bar?baz=bux#hash end',
    'start.com/foo/bar?baz=bux#hash middle end',
    'start middle end.com/foo/bar?baz=bux#hash',
    'newline1.com\nnewline2.com',
    'not.. a..url ..here',
    'e.g.',
    'e.g. real.com fake.notreal',
    'something-cool.jpg',
    'website.com.jpg',
    'e.g./foo',
    'website.com.jpg/foo',
    'Classic article https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
    'Classic article https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/ ',
    'https://foo.com https://bar.com/whatever https://baz.com',
    'punctuation https://foo.com, https://bar.com/whatever; https://baz.com.',
    'parenthetical (https://foo.com)',
    'except for https://foo.com/thing_(cool)',
  ]
  const outputs = [
    ['no linkable'],
    [{link: '@start'}, ' middle end'],
    ['start ', {link: '@middle'}, ' end'],
    ['start middle ', {link: '@end'}],
    [{link: '@start'}, ' ', {link: '@middle'}, ' ', {link: '@end'}],
    [{link: '@full123.test-of-chars'}],
    ['not@right'],
    [{link: '@bad'}, '!@#$chars'],
    [{link: '@newline1'}, '\n', {link: '@newline2'}],
    ['parenthetical (', {link: '@handle'}, ')'],
    ['start ', {link: 'https://middle.com'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'https://start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'https://end.com/foo/bar?baz=bux#hash'}],
    [{link: 'https://newline1.com'}, '\n', {link: 'https://newline2.com'}],
    ['start ', {link: 'middle.com'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'end.com/foo/bar?baz=bux#hash'}],
    [{link: 'newline1.com'}, '\n', {link: 'newline2.com'}],
    ['not.. a..url ..here'],
    ['e.g.'],
    ['e.g. ', {link: 'real.com'}, ' fake.notreal'],
    ['something-cool.jpg'],
    ['website.com.jpg'],
    ['e.g./foo'],
    ['website.com.jpg/foo'],
    [
      'Classic article ',
      {
        link: 'https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
      },
    ],
    [
      'Classic article ',
      {
        link: 'https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
      },
      ' ',
    ],
    [
      {link: 'https://foo.com'},
      ' ',
      {link: 'https://bar.com/whatever'},
      ' ',
      {link: 'https://baz.com'},
    ],
    [
      'punctuation ',
      {link: 'https://foo.com'},
      ', ',
      {link: 'https://bar.com/whatever'},
      '; ',
      {link: 'https://baz.com'},
      '.',
    ],
    ['parenthetical (', {link: 'https://foo.com'}, ')'],
    ['except for ', {link: 'https://foo.com/thing_(cool)'}],
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = detectLinkables(input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('pluralize', () => {
  const inputs: [number, string, string?][] = [
    [1, 'follower'],
    [1, 'member'],
    [100, 'post'],
    [1000, 'repost'],
    [10000, 'upvote'],
    [100000, 'other'],
    [2, 'man', 'men'],
  ]
  const outputs = [
    'follower',
    'member',
    'posts',
    'reposts',
    'upvotes',
    'others',
    'men',
  ]

  it('correctly pluralizes a set of words', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = pluralize(...input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('makeRecordUri', () => {
  const inputs: [string, string, string][] = [
    ['alice.test', 'app.bsky.feed.post', '3jk7x4irgv52r'],
  ]
  const outputs = ['at://alice.test/app.bsky.feed.post/3jk7x4irgv52r']

  it('correctly builds a record URI', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = makeRecordUri(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('ago', () => {
  const inputs = [
    1671461038,
    '04 Dec 1995 00:12:00 GMT',
    new Date(),
    new Date().setSeconds(new Date().getSeconds() - 10),
    new Date().setMinutes(new Date().getMinutes() - 10),
    new Date().setHours(new Date().getHours() - 1),
    new Date().setDate(new Date().getDate() - 1),
    new Date().setMonth(new Date().getMonth() - 1),
  ]
  const outputs = [
    new Date(1671461038).toLocaleDateString(),
    new Date('04 Dec 1995 00:12:00 GMT').toLocaleDateString(),
    'now',
    '10s',
    '10m',
    '1h',
    '1d',
    '1mo',
  ]

  it('correctly calculates how much time passed, in a string', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = ago(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('makeValidHandle', () => {
  const inputs = [
    'test-handle-123',
    'test!"#$%&/()=?_',
    'this-handle-should-be-too-big',
  ]
  const outputs = ['test-handle-123', 'test', 'this-handle-should-b']

  it('correctly parses and corrects handles', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = makeValidHandle(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('createFullHandle', () => {
  const inputs: [string, string][] = [
    ['test-handle-123', 'test'],
    ['.test.handle', 'test.test.'],
    ['test.handle.', '.test.test'],
  ]
  const outputs = [
    'test-handle-123.test',
    '.test.handle.test.test.',
    'test.handle.test.test',
  ]

  it('correctly parses and corrects handles', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = createFullHandle(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('enforceLen', () => {
  const inputs: [string, number][] = [
    ['Hello World!', 5],
    ['Hello World!', 20],
    ['', 5],
  ]
  const outputs = ['Hello', 'Hello World!', '']

  it('correctly enforces defined length on a given string', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = enforceLen(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('cleanError', () => {
  const inputs = [
    'TypeError: Network request failed',
    'Error: Aborted',
    'Error: TypeError "x" is not a function',
    'Error: SyntaxError unexpected token "export"',
    'Some other error',
  ]
  const outputs = [
    'Unable to connect. Please check your internet connection and try again.',
    'Unable to connect. Please check your internet connection and try again.',
    'TypeError "x" is not a function',
    'SyntaxError unexpected token "export"',
    'Some other error',
  ]

  it('removes extra content from error message', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = cleanError(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toNiceDomain', () => {
  const inputs = [
    'https://example.com/index.html',
    'https://bsky.app',
    'https://bsky.social',
    '#123123123',
  ]
  const outputs = ['example.com', 'bsky.app', 'Bluesky Social', '#123123123']

  it("displays the url's host in a easily readable manner", () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toNiceDomain(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toShortUrl', () => {
  const inputs = [
    'https://bsky.app',
    'https://bsky.app/3jk7x4irgv52r',
    'https://bsky.app/3jk7x4irgv52r2313y182h9',
    'https://very-long-domain-name.com/foo',
    'https://very-long-domain-name.com/foo?bar=baz#andsomemore',
  ]
  const outputs = [
    'bsky.app',
    'bsky.app/3jk7x4irgv52r',
    'bsky.app/3jk7x4irgv52...',
    'very-long-domain-name.com/foo',
    'very-long-domain-name.com/foo?bar=baz#...',
  ]

  it('shortens the url', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toShortUrl(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('toShareUrl', () => {
  const inputs = ['https://bsky.app', '/3jk7x4irgv52r', 'item/test/123']
  const outputs = [
    'https://bsky.app',
    'https://bsky.app/3jk7x4irgv52r',
    'https://bsky.app/item/test/123',
  ]

  it('appends https, when not present', () => {
    for (let i = 0; i < inputs.length; i++) {
      const result = toShareUrl(inputs[i])
      expect(result).toEqual(outputs[i])
    }
  })
})

describe('shortenLinks', () => {
  const inputs = [
    'start https://middle.com/foo/bar?baz=bux#hash end',
    'https://start.com/foo/bar?baz=bux#hash middle end',
    'start middle https://end.com/foo/bar?baz=bux#hash',
    'https://newline1.com/very/long/url/here\nhttps://newline2.com/very/long/url/here',
    'Classic article https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
  ]
  const outputs = [
    [
      'start middle.com/foo/bar?baz=... end',
      ['https://middle.com/foo/bar?baz=bux#hash'],
    ],
    [
      'start.com/foo/bar?baz=... middle end',
      ['https://start.com/foo/bar?baz=bux#hash'],
    ],
    [
      'start middle end.com/foo/bar?baz=...',
      ['https://end.com/foo/bar?baz=bux#hash'],
    ],
    [
      'newline1.com/very/long/ur...\nnewline2.com/very/long/ur...',
      [
        'https://newline1.com/very/long/url/here',
        'https://newline2.com/very/long/url/here',
      ],
    ],
    [
      'Classic article socket3.wordpress.com/2018/02/03/d...',
      [
        'https://socket3.wordpress.com/2018/02/03/designing-windows-95s-user-interface/',
      ],
    ],
  ]

  it('correctly shortens rich text while preserving facet URIs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const inputRT = new RichText({text: input})
      inputRT.detectFacetsWithoutResolution()
      const outputRT = shortenLinks(inputRT)
      expect(outputRT.text).toEqual(outputs[i][0])
      expect(outputRT.facets?.length).toEqual(outputs[i][1].length)
      for (let j = 0; j < outputs[i][1].length; j++) {
        expect(outputRT.facets![j].features[0].uri).toEqual(outputs[i][1][j])
      }
    }
  })
})

describe('parseEmbedPlayerFromUrl', () => {
  const inputs = [
    'https://youtu.be/videoId',
    'https://www.youtube.com/watch?v=videoId',
    'https://www.youtube.com/watch?v=videoId&feature=share',
    'https://youtube.com/watch?v=videoId',
    'https://youtube.com/watch?v=videoId&feature=share',
    'https://youtube.com/shorts/videoId',
    'https://m.youtube.com/watch?v=videoId',

    'https://youtube.com/shorts/',
    'https://youtube.com/',
    'https://youtube.com/random',

    'https://twitch.tv/channelName',
    'https://www.twitch.tv/channelName',
    'https://m.twitch.tv/channelName',

    'https://twitch.tv/channelName/clip/clipId',
    'https://twitch.tv/videos/videoId',

    'https://open.spotify.com/playlist/playlistId',
    'https://open.spotify.com/playlist/playlistId?param=value',
    'https://open.spotify.com/locale/playlist/playlistId',

    'https://open.spotify.com/track/songId',
    'https://open.spotify.com/track/songId?param=value',
    'https://open.spotify.com/locale/track/songId',

    'https://open.spotify.com/album/albumId',
    'https://open.spotify.com/album/albumId?param=value',
    'https://open.spotify.com/locale/album/albumId',

    'https://soundcloud.com/user/track',
    'https://soundcloud.com/user/sets/set',
    'https://soundcloud.com/user/',

    'https://music.apple.com/us/playlist/playlistName/playlistId',
    'https://music.apple.com/us/album/albumName/albumId',
    'https://music.apple.com/us/album/albumName/albumId?i=songId',

    'https://vimeo.com/videoId',
    'https://vimeo.com/videoId?autoplay=0',

    'https://giphy.com/gifs/some-random-gif-name-gifId',
    'https://giphy.com/gif/some-random-gif-name-gifId',
    'https://giphy.com/gifs/',

    'https://media.giphy.com/media/gifId/giphy.webp',
    'https://media0.giphy.com/media/gifId/giphy.webp',
    'https://media1.giphy.com/media/gifId/giphy.gif',
    'https://media2.giphy.com/media/gifId/giphy.webp',
    'https://media3.giphy.com/media/gifId/giphy.mp4',
    'https://media4.giphy.com/media/gifId/giphy.webp',
    'https://media5.giphy.com/media/gifId/giphy.mp4',
    'https://media0.giphy.com/media/gifId/giphy.mp3',
    'https://media1.google.com/media/gifId/giphy.webp',

    'https://media.giphy.com/media/trackingId/gifId/giphy.webp',

    'https://i.giphy.com/media/gifId/giphy.webp',
    'https://i.giphy.com/media/gifId/giphy.webp',
    'https://i.giphy.com/gifId.gif',
    'https://i.giphy.com/gifId.gif',

    'https://tenor.com/view/gifId',
    'https://tenor.com/notView/gifId',
    'https://tenor.com/view',
    'https://tenor.com/view/gifId.gif',
    'https://tenor.com/intl/view/gifId.gif',
  ]

  const outputs = [
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_short',
      source: 'youtubeShorts',
      hideDetails: true,
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri:
        'https://www.youtube.com/embed/videoId?autoplay=1&playsinline=1&start=0',
    },

    undefined,
    undefined,
    undefined,

    {
      type: 'twitch_video',
      source: 'twitch',
      playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=channelName&parent=localhost`,
    },
    {
      type: 'twitch_video',
      source: 'twitch',
      playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=channelName&parent=localhost`,
    },
    {
      type: 'twitch_video',
      source: 'twitch',
      playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=channelName&parent=localhost`,
    },
    {
      type: 'twitch_video',
      source: 'twitch',
      playerUri: `https://clips.twitch.tv/embed?volume=0.5&autoplay=true&clip=clipId&parent=localhost`,
    },
    {
      type: 'twitch_video',
      source: 'twitch',
      playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&video=videoId&parent=localhost`,
    },

    {
      type: 'spotify_playlist',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/playlist/playlistId`,
    },
    {
      type: 'spotify_playlist',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/playlist/playlistId`,
    },
    {
      type: 'spotify_playlist',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/playlist/playlistId`,
    },

    {
      type: 'spotify_song',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/track/songId`,
    },
    {
      type: 'spotify_song',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/track/songId`,
    },
    {
      type: 'spotify_song',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/track/songId`,
    },

    {
      type: 'spotify_album',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/album/albumId`,
    },
    {
      type: 'spotify_album',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/album/albumId`,
    },
    {
      type: 'spotify_album',
      source: 'spotify',
      playerUri: `https://open.spotify.com/embed/album/albumId`,
    },

    {
      type: 'soundcloud_track',
      source: 'soundcloud',
      playerUri: `https://w.soundcloud.com/player/?url=https://soundcloud.com/user/track&auto_play=true&visual=false&hide_related=true`,
    },
    {
      type: 'soundcloud_set',
      source: 'soundcloud',
      playerUri: `https://w.soundcloud.com/player/?url=https://soundcloud.com/user/sets/set&auto_play=true&visual=false&hide_related=true`,
    },
    undefined,

    {
      type: 'apple_music_playlist',
      source: 'appleMusic',
      playerUri:
        'https://embed.music.apple.com/us/playlist/playlistName/playlistId',
    },
    {
      type: 'apple_music_album',
      source: 'appleMusic',
      playerUri: 'https://embed.music.apple.com/us/album/albumName/albumId',
    },
    {
      type: 'apple_music_song',
      source: 'appleMusic',
      playerUri:
        'https://embed.music.apple.com/us/album/albumName/albumId?i=songId',
    },

    {
      type: 'vimeo_video',
      source: 'vimeo',
      playerUri: 'https://player.vimeo.com/video/videoId?autoplay=1',
    },
    {
      type: 'vimeo_video',
      source: 'vimeo',
      playerUri: 'https://player.vimeo.com/video/videoId?autoplay=1',
    },

    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    undefined,
    undefined,

    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    undefined,
    undefined,
    undefined,

    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },

    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/giphy.webp',
    },

    {
      type: 'tenor_gif',
      source: 'tenor',
      isGif: true,
      hideDetails: true,
      playerUri: 'https://tenor.com/view/gifId.gif',
    },
    undefined,
    undefined,
    {
      type: 'tenor_gif',
      source: 'tenor',
      isGif: true,
      hideDetails: true,
      playerUri: 'https://tenor.com/view/gifId.gif',
    },
    {
      type: 'tenor_gif',
      source: 'tenor',
      isGif: true,
      hideDetails: true,
      playerUri: 'https://tenor.com/intl/view/gifId.gif',
    },
  ]

  it('correctly grabs the correct id from uri', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = outputs[i]

      const res = parseEmbedPlayerFromUrl(input)

      console.log(input)

      expect(res).toEqual(output)
    }
  })
})
