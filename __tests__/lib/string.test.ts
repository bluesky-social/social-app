import {RichText} from '@atproto/api'

import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {
  createStarterPackGooglePlayUri,
  createStarterPackLinkFromAndroidReferrer,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {tenorUrlToBskyGifUrl} from '#/state/queries/tenor'
import {cleanError} from '../../src/lib/strings/errors'
import {createFullHandle, makeValidHandle} from '../../src/lib/strings/handles'
import {enforceLen} from '../../src/lib/strings/helpers'
import {detectLinkables} from '../../src/lib/strings/rich-text-detection'
import {shortenLinks} from '../../src/lib/strings/rich-text-manip'
import {
  makeRecordUri,
  toNiceDomain,
  toShareUrl,
  toShortUrl,
} from '../../src/lib/strings/url-helpers'

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
    'https://youtu.be/videoId?t=1s',
    'https://www.youtube.com/watch?v=videoId',
    'https://www.youtube.com/watch?v=videoId&feature=share',
    'https://www.youtube.com/watch?v=videoId&t=1s',
    'https://youtube.com/watch?v=videoId',
    'https://youtube.com/watch?v=videoId&feature=share',
    'https://youtube.com/shorts/videoId',
    'https://youtube.com/live/videoId',
    'https://m.youtube.com/watch?v=videoId',
    'https://music.youtube.com/watch?v=videoId',

    'https://youtube.com/shorts/',
    'https://youtube.com/',
    'https://youtube.com/random',
    'https://youtube.com/live/',

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
    'https://music.apple.com/us/song/songName/songId',

    'https://vimeo.com/videoId',
    'https://vimeo.com/videoId?autoplay=0',

    'https://giphy.com/gifs/some-random-gif-name-gifId',
    'https://giphy.com/gif/some-random-gif-name-gifId',
    'https://giphy.com/gifs/',

    'https://giphy.com/gifs/39248209509382934029?hh=100&ww=100',

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

    'https://media.tenor.com/someID_AAAAC/someName.gif?hh=100&ww=100',
    'https://media.tenor.com/someID_AAAAC/someName.gif',
    'https://media.tenor.com/someID/someName.gif',
    'https://media.tenor.com/someID',
    'https://media.tenor.com',

    'https://www.flickr.com/photos/username/albums/72177720308493661',
    'https://flickr.com/photos/username/albums/72177720308493661',
    'https://flickr.com/photos/username/albums/72177720308493661/',
    'https://flickr.com/photos/username/albums/72177720308493661//',
    'https://flic.kr/s/aHBqjAES3i',

    'https://flickr.com/foetoes/username/albums/3903',
    'https://flickr.com/albums/3903',
    'https://flic.kr/s/OolI',
    'https://flic.kr/t/aHBqjAES3i',

    'https://www.flickr.com/groups/898944@N23/pool',
    'https://flickr.com/groups/898944@N23/pool',
    'https://flickr.com/groups/898944@N23/pool/',
    'https://flickr.com/groups/898944@N23/pool//',
    'https://flic.kr/go/8WJtR',

    'https://www.flickr.com/groups/898944@N23/',
    'https://www.flickr.com/groups',

    'https://maxblansjaar.bandcamp.com/album/false-comforts',
    'https://grmnygrmny.bandcamp.com/track/fluid',
    'https://sufjanstevens.bandcamp.com/',
    'https://sufjanstevens.bandcamp.com',
    'https://bandcamp.com/',
    'https://bandcamp.com',
  ]

  const outputs = [
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=1',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=1',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_short',
      source: 'youtubeShorts',
      hideDetails: true,
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },
    {
      type: 'youtube_video',
      source: 'youtube',
      playerUri: 'https://bsky.app/iframe/youtube.html?videoId=videoId&start=0',
    },

    undefined,
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
      type: 'apple_music_song',
      source: 'appleMusic',
      playerUri: 'https://embed.music.apple.com/us/song/songName/songId',
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
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    undefined,
    undefined,
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/39248209509382934029',
      playerUri: 'https://i.giphy.com/media/39248209509382934029/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
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
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },

    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },
    {
      type: 'giphy_gif',
      source: 'giphy',
      isGif: true,
      hideDetails: true,
      metaUri: 'https://giphy.com/gifs/gifId',
      playerUri: 'https://i.giphy.com/media/gifId/200.webp',
    },

    undefined,
    undefined,
    undefined,
    undefined,
    undefined,

    {
      type: 'tenor_gif',
      source: 'tenor',
      isGif: true,
      hideDetails: true,
      playerUri: 'https://t.gifs.bsky.app/someID_AAAAM/someName.gif',
      dimensions: {
        width: 100,
        height: 100,
      },
    },
    undefined,
    undefined,
    undefined,
    undefined,

    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/photosets/72177720308493661',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/photosets/72177720308493661',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/photosets/72177720308493661',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/photosets/72177720308493661',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/photosets/72177720308493661',
    },

    undefined,
    undefined,
    undefined,
    undefined,

    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/groups/898944@N23',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/groups/898944@N23',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/groups/898944@N23',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/groups/898944@N23',
    },
    {
      type: 'flickr_album',
      source: 'flickr',
      playerUri: 'https://embedr.flickr.com/groups/898944@N23',
    },

    undefined,
    undefined,

    {
      type: 'bandcamp_album',
      source: 'bandcamp',
      playerUri:
        'https://bandcamp.com/EmbeddedPlayer/url=https%3A%2F%2Fmaxblansjaar.bandcamp.com%2Falbum%2Ffalse-comforts/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/',
    },
    {
      type: 'bandcamp_track',
      source: 'bandcamp',
      playerUri:
        'https://bandcamp.com/EmbeddedPlayer/url=https%3A%2F%2Fgrmnygrmny.bandcamp.com%2Ftrack%2Ffluid/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/',
    },
    undefined,
    undefined,
    undefined,
    undefined,
  ]

  it('correctly grabs the correct id from uri', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = outputs[i]

      const res = parseEmbedPlayerFromUrl(input)

      expect(res).toEqual(output)
    }
  })
})

describe('createStarterPackLinkFromAndroidReferrer', () => {
  const validOutput = 'at://haileyok.com/app.bsky.graph.starterpack/rkey'

  it('returns a link when input contains utm_source and utm_content', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_source=bluesky&utm_content=starterpack_haileyok.com_rkey',
      ),
    ).toEqual(validOutput)

    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_source=bluesky&utm_content=starterpack_test-lover-9000.com_rkey',
      ),
    ).toEqual('at://test-lover-9000.com/app.bsky.graph.starterpack/rkey')
  })

  it('returns a link when input contains utm_source and utm_content in different order', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_content=starterpack_haileyok.com_rkey&utm_source=bluesky',
      ),
    ).toEqual(validOutput)
  })

  it('returns a link when input contains other parameters as well', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_source=bluesky&utm_medium=starterpack&utm_content=starterpack_haileyok.com_rkey',
      ),
    ).toEqual(validOutput)
  })

  it('returns null when utm_source is not present', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_content=starterpack_haileyok.com_rkey',
      ),
    ).toEqual(null)
  })

  it('returns null when utm_content is not present', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer('utm_source=bluesky'),
    ).toEqual(null)
  })

  it('returns null when utm_content is malformed', () => {
    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_content=starterpack_haileyok.com',
      ),
    ).toEqual(null)

    expect(
      createStarterPackLinkFromAndroidReferrer('utm_content=starterpack'),
    ).toEqual(null)

    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_content=starterpack_haileyok.com_rkey_more',
      ),
    ).toEqual(null)

    expect(
      createStarterPackLinkFromAndroidReferrer(
        'utm_content=notastarterpack_haileyok.com_rkey',
      ),
    ).toEqual(null)
  })
})

describe('parseStarterPackHttpUri', () => {
  const baseUri = 'https://bsky.app/start'

  it('returns a valid at uri when http uri is valid', () => {
    const validHttpUri = `${baseUri}/haileyok.com/rkey`
    expect(parseStarterPackUri(validHttpUri)).toEqual({
      name: 'haileyok.com',
      rkey: 'rkey',
    })

    const validHttpUri2 = `${baseUri}/haileyok.com/ilovetesting`
    expect(parseStarterPackUri(validHttpUri2)).toEqual({
      name: 'haileyok.com',
      rkey: 'ilovetesting',
    })

    const validHttpUri3 = `${baseUri}/testlover9000.com/rkey`
    expect(parseStarterPackUri(validHttpUri3)).toEqual({
      name: 'testlover9000.com',
      rkey: 'rkey',
    })
  })

  it('returns null when there is no rkey', () => {
    const validHttpUri = `${baseUri}/haileyok.com`
    expect(parseStarterPackUri(validHttpUri)).toEqual(null)
  })

  it('returns null when there is an extra path', () => {
    const validHttpUri = `${baseUri}/haileyok.com/rkey/other`
    expect(parseStarterPackUri(validHttpUri)).toEqual(null)
  })

  it('returns null when there is no handle or rkey', () => {
    const validHttpUri = `${baseUri}`
    expect(parseStarterPackUri(validHttpUri)).toEqual(null)
  })

  it('returns null when the route is not /start or /starter-pack', () => {
    const validHttpUri = 'https://bsky.app/start/haileyok.com/rkey'
    expect(parseStarterPackUri(validHttpUri)).toEqual({
      name: 'haileyok.com',
      rkey: 'rkey',
    })

    const validHttpUri2 = 'https://bsky.app/starter-pack/haileyok.com/rkey'
    expect(parseStarterPackUri(validHttpUri2)).toEqual({
      name: 'haileyok.com',
      rkey: 'rkey',
    })

    const invalidHttpUri = 'https://bsky.app/profile/haileyok.com/rkey'
    expect(parseStarterPackUri(invalidHttpUri)).toEqual(null)
  })

  it('returns the at uri when the input is a valid starterpack at uri', () => {
    const validAtUri = 'at://did:plc:123/app.bsky.graph.starterpack/rkey'
    expect(parseStarterPackUri(validAtUri)).toEqual({
      name: 'did:plc:123',
      rkey: 'rkey',
    })
  })

  it('returns null when the at uri has no rkey', () => {
    const validAtUri = 'at://did:plc:123/app.bsky.graph.starterpack'
    expect(parseStarterPackUri(validAtUri)).toEqual(null)
  })

  it('returns null when the collection is not app.bsky.graph.starterpack', () => {
    const validAtUri = 'at://did:plc:123/app.bsky.graph.list/rkey'
    expect(parseStarterPackUri(validAtUri)).toEqual(null)
  })

  it('returns null when the input is undefined', () => {
    expect(parseStarterPackUri(undefined)).toEqual(null)
  })
})

describe('createStarterPackGooglePlayUri', () => {
  const base =
    'https://play.google.com/store/apps/details?id=xyz.blueskyweb.app&referrer=utm_source%3Dbluesky%26utm_medium%3Dstarterpack%26utm_content%3Dstarterpack_'

  it('returns valid google play uri when input is valid', () => {
    expect(createStarterPackGooglePlayUri('name', 'rkey')).toEqual(
      `${base}name_rkey`,
    )
  })

  it('returns null when no rkey is supplied', () => {
    // @ts-expect-error test
    expect(createStarterPackGooglePlayUri('name', undefined)).toEqual(null)
  })

  it('returns null when no name or rkey are supplied', () => {
    // @ts-expect-error test
    expect(createStarterPackGooglePlayUri(undefined, undefined)).toEqual(null)
  })

  it('returns null when rkey is supplied but no name', () => {
    // @ts-expect-error test
    expect(createStarterPackGooglePlayUri(undefined, 'rkey')).toEqual(null)
  })
})

describe('tenorUrlToBskyGifUrl', () => {
  const inputs = [
    'https://media.tenor.com/someID_AAAAC/someName.gif',
    'https://media.tenor.com/someID/someName.gif',
  ]

  it.each(inputs)(
    'returns url with t.gifs.bsky.app as hostname for input url',
    input => {
      const out = tenorUrlToBskyGifUrl(input)
      expect(out.startsWith('https://t.gifs.bsky.app/')).toEqual(true)
    },
  )
})
